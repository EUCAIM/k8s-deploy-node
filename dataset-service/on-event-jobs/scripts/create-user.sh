#!/bin/bash 

# Echo all commands before execute
#set -x
# Interrupt and exit on any error
set -e

# Environmental variables required:
#   TENANT_NAME
#   TENANT_ROLES
#   TENANT_SITE
#   TENANT_PROJECTS

#   K8S_ENDPOINT
#   K8S_TOKEN

#   CEPH_HOST
#   CEPH_ADMIN_USER
#   CEPH_ADMIN_KEY
#   CEPH_FS_VOL_NAME
#   CEPH_PREFIX_ACCOUNT

#   MOUNTED_DIR_PERSISTENT_HOMES
#   DIR_PERSISTENT_SHARED
#   DIR_PERSISTENT_HOMES
#   DIR_DATASETS
#   DIR_DATA

#   KEYCLOAK_TOKEN_ENDPOINT
#   KEYCLOAK_ADMIN_ENDPOINT
#   KEYCLOAK_CLIENT
#   KEYCLOAK_CLIENT_SECRET

#   QPI_ADMIN_ENDPOINT
#   QPI_ADMIN_CLIENT_ID
#   QPI_ADMIN_USERNAME
#   QPI_ADMIN_PASSWORD

#   GUACAMOLE_ENDPOINT
#   GUACAMOLE_ADMIN_USER
#   GUACAMOLE_ADMIN_PASSWORD

#   EXTERNAL_SHARING_SERVICE_ENDPOINT

#   MAIN_DOMAIN_NAME
#   HARBOR_DOMAIN_NAME


echo "$(date -Iseconds) - Running scripts to create the user '${TENANT_NAME}'."
echo "ROLES=${TENANT_ROLES}"
echo "SITE=${TENANT_SITE}"
echo "PROJECTS=${TENANT_PROJECTS}"

echo -e "\n##############################################################################"

echo "=============== Set QP-Insights user ID as a user attribute in Keycloak (if not exists it is created from email)"
python3 set_qpinsights_id_in_keycloak.py "${KEYCLOAK_TOKEN_ENDPOINT}" ${KEYCLOAK_CLIENT} ${KEYCLOAK_CLIENT_SECRET} "${KEYCLOAK_ADMIN_ENDPOINT}" \
                                         ${TENANT_NAME} "qpi_id" > /tmp/qpi_id.txt
export QPI_ID=$(cat /tmp/qpi_id.txt)
echo "QPI_ID=${QPI_ID}"

echo "=============== Create the user account in QP-Insights"
if [ "$TENANT_SITE" == "" ]; then
    echo The site is empty but QP-Insights requires any site, so we will assign the special site \"OTHER\".
    export TENANT_SITE="OTHER"
fi
python3 manage_qpinsights_account.py "${KEYCLOAK_TOKEN_ENDPOINT}" ${QPI_ADMIN_CLIENT_ID} ${QPI_ADMIN_USERNAME} ${QPI_ADMIN_PASSWORD}  \
                                     "${QPI_ADMIN_ENDPOINT}" create "$QPI_ID" "${TENANT_NAME}" "${TENANT_SITE}" "-" "${TENANT_PROJECTS}"

if echo ${TENANT_ROLES} | grep -i "data-scientist" > /dev/null; then
    echo -e "\n##############################################################################"
    KUBECTL_CMD="kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN}"
    export TENANT_NAMESPACE="user-${TENANT_NAME}"
    echo "NAMESPACE=${TENANT_NAMESPACE}"

    echo -e "\n##############################################################################"
    echo "=============== Create the k8s namespace for the user"
    if ${KUBECTL_CMD} get namespace ${TENANT_NAMESPACE} 2> /dev/null; then 
        echo "The namespace already exists."
    else
        ${KUBECTL_CMD} create namespace ${TENANT_NAMESPACE}
    fi

    # Initialize ceph configuration file and keyring
    # replacing CEPH_HOST
    tpl -e templates/ceph.conf.tpl > /etc/ceph/ceph.conf
    # replacing CEPH_ADMIN_USER, CEPH_ADMIN_KEY
    tpl -e templates/ceph.key.tpl > /etc/ceph/ceph.client.${CEPH_ADMIN_USER}.keyring
    
    echo -e "\n##############################################################################"
    echo "=============== Create the persistent home"
    echo "Creating directory: ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME} ..."
    mkdir -p ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME}
    chown 1000:1000 ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME}
    if [ -f ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME}/init.sh ]; then
        echo "The user custom init script already exists."
    else
        echo "Copying the user custom init script template..."
        cp templates/init.sh ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME}/
        chown 1000:1000 ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME}/init.sh
    fi

    echo -e "\n##############################################################################"
    echo "=============== Create the ceph account"
    # Note: doble hyphen to avoid possible conflict with CEPH_ADMIN_USER if it has the same prefix.
    export CEPH_NEW_USER=${CEPH_PREFIX_ACCOUNT}--${TENANT_NAME}
    # ceph --user ${CEPH_ADMIN_USER} auth get-or-create client.${CEPH_NEW_USER} \
    #      mon "allow r" \
    #      osd "allow rw pool="${CEPH_FS_VOL_NAME}"" \
    #      mds "allow rw path="${DIR_PERSISTENT_HOMES}/${TENANT_NAME}", allow rw path="${DIR_PERSISTENT_SHARED}", allow r path="${DIR_DATASETS}", allow r path="${DIR_DATA}
    if ceph --user ${CEPH_ADMIN_USER} auth get client.${CEPH_NEW_USER} > /dev/null 2>&1; then
        echo "The CEPH user exists, let's ensure the access to the volumes..."
        ceph --user ${CEPH_ADMIN_USER} auth caps client.${CEPH_NEW_USER} \
           mon "allow r fsname=${CEPH_FS_VOL_NAME}" \
           osd "allow rw tag cephfs data=${CEPH_FS_VOL_NAME}" \
           mds "allow r fsname=${CEPH_FS_VOL_NAME} path=${DIR_DATASETS}, allow r fsname=${CEPH_FS_VOL_NAME} path=${DIR_DATASETS}-test, allow r fsname=${CEPH_FS_VOL_NAME} path=${DIR_DATA}, allow r fsname=${CEPH_FS_VOL_NAME} path=${DIR_DATA}-test, allow rw fsname=${CEPH_FS_VOL_NAME} path=${DIR_PERSISTENT_HOMES}/${TENANT_NAME}, allow rw fsname=${CEPH_FS_VOL_NAME} path=${DIR_PERSISTENT_SHARED}"
    else
        echo "The CEPH user does not exist, let's create it..."
        ceph --user ${CEPH_ADMIN_USER} fs authorize ${CEPH_FS_VOL_NAME} client.${CEPH_NEW_USER} ${DIR_DATASETS} r ${DIR_DATASETS}-test r \
                                                                                                ${DIR_DATA} r ${DIR_DATA}-test r \
                                                                                                ${DIR_PERSISTENT_HOMES}/${TENANT_NAME} rw ${DIR_PERSISTENT_SHARED} rw
        # "ceph fs authorize" should work also if the user already exists but some times throws the error:
        #      Error EINVAL: client.chaimeleon-imarzar already has fs capabilities that differ from those supplied. To generate a new auth key for client.chaimeleon-imarzar, first remove client.chaimeleon-imarzar from configuration files, execute 'ceph auth rm client.chaimeleon-imarzar', then execute this command again.
        # But we don't want to generate a new key, so "ceph auth caps" is the alternative method we use when the user already exists.
    fi
    echo "---------------------------------------------------------------"
    echo "Display ceph user: "
    ceph --user ${CEPH_ADMIN_USER} auth get client.${CEPH_NEW_USER}
    echo "---"
    # Obtain the key of the previously created ceph account 
    export _NEW_USER_CEPH_KEY=$(ceph --user ${CEPH_ADMIN_USER} auth get-key client.${CEPH_NEW_USER})

    echo -e "\n##############################################################################"
    echo "=============== Create ceph secret in k8s"
    # replacing TENANT_NAMESPACE, _NEW_USER_CEPH_KEY
    tpl -e templates/ceph-secret.yml.tpl > /tmp/${CEPH_NEW_USER}-secret.yml
    echo "/tmp/${CEPH_NEW_USER}-secret.yml:"
    cat /tmp/${CEPH_NEW_USER}-secret.yml
    echo "---------------------------------------------------------------"
    echo "Creating the ceph-auth secret ..."
    ${KUBECTL_CMD} apply -f /tmp/${CEPH_NEW_USER}-secret.yml

    # That is currently not needed because now this script is called by dataset-service, the GID can be included in the call.
    # echo -e "\n##############################################################################"
    # echo "=============== CREATE USER DATASET SERVICE"
    # # Obtain AUTH token from keycloak
    # echo "Obtaining AUTH token from keycloak ..."
    # curl -d "grant_type=client_credentials" -d "client_id=${KEYCLOAK_CLIENT}" -d "client_secret=${KEYCLOAK_CLIENT_SECRET}" \
    #      "${KEYCLOAK_TOKEN_ENDPOINT}" > /tmp/auth-token.json
    # echo "Response: "
    # cat /tmp/auth-token.json 
    # echo -e "\n---"
    # export _DATASET_AUTH_TOKEN=$(jq -r .access_token /tmp/auth-token.json )
    # 
    # echo "Obtaining the GID of the user from dataset service ..."
    # curl -X GET -H "Authorization: bearer ${_DATASET_AUTH_TOKEN}" -H "Content-Type: application/json" \
    #      "${DATASET_SERVICE_ENDPOINT}/api/users/${TENANT_NAME}" > /tmp/user-info.json
    # echo "Response: "
    # cat /tmp/user-info.json
    # echo -e "\n---"
    # 
    # ## To do: if 404, 
    # ## PUT "${DATASET_SERVICE_ENDPOINT}/api/users/${TENANT_NAME}"
    # ## and try again the GET
    # 
    # export _NEW_USER_GID=$(jq -r .gid /tmp/user-info.json )

    # That configmap is currently not needed. The operator has all the info.
    # echo -e "\n##############################################################################"
    # echo "=============== CREATE USER CONFIGMAP"
    # replacing TENANT_NAMESPACE, DIR_DATASETS, DIR_DATA, DIR_PERSISTENT_HOMES, TENANT_NAME, DIR_PERSISTENT_SHARED, CEPH_NEW_USER, _NEW_USER_GID, CEPH_MONITORS, CEPH_HOST
    # tpl -e templates/user-configmap.yml.tpl > /tmp/user-configmap.yml
    # echo "/tmp/user-configmap.yml:"
    # cat /tmp/user-configmap.yml
    # echo "---------------------------------------------------------------"
    # echo "Creating the user-configmap ... "
    # ${KUBECTL_CMD} apply -f /tmp/user-configmap.yml

    # That is not required because the operator currently manages the securityContext.
    # echo -e "\n##############################################################################"
    # echo "=============== KYVERNO POLICY - Security context"
    # # Security context -> Allow use onky an specific GID
    # # replacing TENANT_NAME, TENANT_NAMESPACE, TENANT_TYPE, _NEW_USER_GID
    # tpl -e templates/kyverno-policies-security-context-gid.yml.tpl > /tmp/user-kyverno-policies-security-context-gid.yml
    # echo "/tmp/user-kyverno-policies-security-context-gid.yml:"
    # cat /tmp/user-kyverno-policies-security-context-gid.yml
    # echo "---------------------------------------------------------------"
    # echo "Creating the Kyverno policy [Security context]..."
    # ${KUBECTL_CMD} apply -f /tmp/user-kyverno-policies-security-context-gid.yml

    # That is not required because the role for datascientists is not currently allowing create/modify resources of type ingress
    # echo -e "\n##############################################################################"
    # echo "=============== KYVERNO POLICY - Ingress root path"
    # # Ingress path -> Allow create ingress objects only if the root path is the namespace of the tenant.
    # # replacing TENANT_NAME, TENANT_NAMESPACE, TENANT_TYPE
    # #tpl -e templates/kyverno-policies-ingress.yml.tpl > /tmp/kyverno-policies-ingress.yml
    # sed 's/{{ TENANT_TYPE }}/'${TENANT_TYPE}'/g' templates/kyverno-policies-ingress.yml.tpl > /tmp/kyverno-policies-ingress.yml
    # sed -i 's/{{ TENANT_NAME }}/'${TENANT_NAME}'/g' /tmp/kyverno-policies-ingress.yml
    # sed -i 's/{{ TENANT_NAMESPACE }}/'${TENANT_NAMESPACE}'/g' /tmp/kyverno-policies-ingress.yml
    # echo "/tmp/kyverno-policies-ingress.yml:"
    # cat /tmp/kyverno-policies-ingress.yml
    # echo "---------------------------------------------------------------"
    # echo "Creating the Kyverno policy [Ingress root path] ..."
    # ${KUBECTL_CMD} apply -f /tmp/kyverno-policies-ingress.yml

    echo -e "\n##############################################################################"
    echo "=============== GUACAMOLE USER "
    # Create Guacamole user to access to the REST API and a private connections group for the user
    export GUACAMOLE_PASSWORD=$(< /dev/urandom tr -dc A-Za-z0-9 | head -c${1:-16};echo;)
    echo "Creating the guacamole user and connections group ..."
    guacli --url "${GUACAMOLE_ENDPOINT}" --user "${GUACAMOLE_ADMIN_USER}" --password "${GUACAMOLE_ADMIN_PASSWORD}" \
           create user "${TENANT_NAME}" --new-user-password "${GUACAMOLE_PASSWORD}" > /tmp/out-guacli.txt || true
           # --can-create-connections
    cat /tmp/out-guacli.txt
    if grep -i "error" /tmp/out-guacli.txt > /dev/null && ! grep "already exists" /tmp/out-guacli.txt > /dev/null; then
        echo "There is an error but is not the known message 'already exists', then exit"
        exit 1
    fi
    #if [ $? -ne 0 ]; then exit 1; fi

    echo -e "\n##############################################################################"
    echo "=============== GUACAMOLE SECRET "
    if grep -i "error" /tmp/out-guacli.txt > /dev/null; then
        echo "The guacamole user already exists."
        if ${KUBECTL_CMD} get secret guacamole-api-auth -n ${TENANT_NAMESPACE}; then 
            echo "And the secret in k8s also exists, so we don't have to change it."
        else
            echo "But the secret in k8s not exists! Please delete de guacamole user and connection group and run the script again."
            exit 1
        fi
    else
        # Store the credentials in a secret
        # replacing TENANT_NAMESPACE, TENANT_NAME, GUACAMOLE_PASSWORD
        tpl -e templates/guacamole-secret.yml.tpl > /tmp/guacamole-api-user-${TENANT_NAME}-secret.yml
        echo "/tmp/guacamole-api-user-${TENANT_NAME}-secret.yml: "
        cat /tmp/guacamole-api-user-${TENANT_NAME}-secret.yml
        echo "---------------------------------------------------------------"
        echo "Creating the guacamole-secret ... "
        ${KUBECTL_CMD} apply -f /tmp/guacamole-api-user-${TENANT_NAME}-secret.yml
    fi

    echo -e "\n##############################################################################"
    echo "=============== CILIUM NETWORK POLICIES "
    # **************************** 
    # Deny Egress traffic
    # **************************** 
    # replacing TENANT_NAME, TENANT_NAMESPACE, MAIN_DOMAIN_NAME, HARBOR_DOMAIN_NAME
    tpl -e templates/ciliumNetworkPolicy-deny-egress.yml.tpl > /tmp/ciliumNetworkPolicy-deny-egress.yml
    echo "/tmp/ciliumNetworkPolicy-deny-egress.yml:"
    cat /tmp/ciliumNetworkPolicy-deny-egress.yml
    echo "---------------------------------------------------------------"
    echo "Creating the Cilium Network Policy [Deny Egress traffic]..."
    ${KUBECTL_CMD} apply -f /tmp/ciliumNetworkPolicy-deny-egress.yml


    # That binding is not required because the binding is done for the group "oidc:data-scientists".
    # echo -e "\n##############################################################################"
    # echo "=============== CLUSTER ROLE BINDING"
    # resource=users-cluster-role-binding.yml
    # cp templates/${resource}.tpl /tmp/${resource}
    # sed -i 's/{{ TENANT_NAME }}/'${TENANT_NAME}'/g' /tmp/${resource}
    # echo "/tmp/${resource}:"
    # cat /tmp/${resource}
    # echo "---------------------------------------------------------------"
    # echo "Creating the cluster role binding ..."
    # ${KUBECTL_CMD} apply -f /tmp/${resource}

    echo -e "\n##############################################################################"
    echo "=============== NAMESPACE ROLE BINDING (user namespace)"
    resource=namespace-role-binding.yml
    cp templates/${resource}.tpl /tmp/${resource}
    sed -i 's/{{ TENANT_NAME }}/'${TENANT_NAME}'/g' /tmp/${resource}
    sed -i 's/{{ TENANT_NAMESPACE }}/'${TENANT_NAMESPACE}'/g' /tmp/${resource}
    echo "/tmp/${resource}:"
    cat /tmp/${resource}
    echo "---------------------------------------------------------------"
    echo "Creating the namespace role binding ..."
    ${KUBECTL_CMD} apply -f /tmp/${resource}

    echo -e "\n##############################################################################"
    echo "=============== EXTERNAL SHARING SERVICE API TOKEN"
    echo "Set the API token as a user attribute in Keycloak (if not exists it is randomly generated)"
    python3 set_api_token.py "${KEYCLOAK_TOKEN_ENDPOINT}" ${KEYCLOAK_CLIENT} ${KEYCLOAK_CLIENT_SECRET} "${KEYCLOAK_ADMIN_ENDPOINT}" \
                              ${TENANT_NAME} "external_sharing_service_api_token" > /tmp/external_sharing_service_api_token.txt
    export API_TOKEN=$(cat /tmp/external_sharing_service_api_token.txt)
    resource=external-sharing-service-secret.yml
    # replacing TENANT_NAMESPACE, EXTERNAL_SHARING_SERVICE_ENDPOINT, API_TOKEN
    tpl -e templates/${resource}.tpl > /tmp/${resource}
    echo "/tmp/${resource}:"
    cat /tmp/${resource}
    echo "---------------------------------------------------------------"
    echo "Creating the external sharing service secret ..."
    ${KUBECTL_CMD} apply -f /tmp/${resource}
    echo "---------------------------------------------------------------"

    echo -e "\n##############################################################################"
    echo "=============== JOBMAN SERVICE API TOKEN"
    echo "Set the API token as a user attribute in Keycloak (if not exists it is randomly generated)"
    python3 set_api_token.py "${KEYCLOAK_TOKEN_ENDPOINT}" ${KEYCLOAK_CLIENT} ${KEYCLOAK_CLIENT_SECRET} "${KEYCLOAK_ADMIN_ENDPOINT}" \
                              ${TENANT_NAME} "jobman_service_api_token" > /tmp/jobman_service_api_token.txt
    export API_TOKEN=$(cat /tmp/jobman_service_api_token.txt)
    resource=jobman-service-secret.yml
    # replacing TENANT_NAMESPACE, API_TOKEN
    tpl -e templates/${resource}.tpl > /tmp/${resource}
    echo "/tmp/${resource}:"
    cat /tmp/${resource}
    echo "---------------------------------------------------------------"
    echo "Creating the jobman service secret ..."
    ${KUBECTL_CMD} apply -f /tmp/${resource}
    echo "---------------------------------------------------------------"

fi

echo "End of scripts to create the user '${TENANT_NAME}'."
