#!/bin/bash 

# Echo all commands before execute
#set -x
# Interrupt and exit on any error
set -e

# Environmental variables required:
#   TENANT_NAME
#   TENANT_ROLES
#   TENANT_PROJECTS

#   K8S_ENDPOINT
#   K8S_TOKEN

#   MOUNTED_DIR_PERSISTENT_HOMES

#   KEYCLOAK_TOKEN_ENDPOINT
#   KEYCLOAK_ADMIN_ENDPOINT
#   KEYCLOAK_CLIENT
#   KEYCLOAK_CLIENT_SECRET

#   GUACAMOLE_ENDPOINT
#   GUACAMOLE_ADMIN_USER
#   GUACAMOLE_ADMIN_PASSWORD

#   EXTERNAL_SHARING_SERVICE_ENDPOINT

#   MAIN_DOMAIN_NAME
#   HARBOR_DOMAIN_NAME


echo "$(date -Iseconds) - Running scripts to create the user '${TENANT_NAME}'."
echo "ROLES=${TENANT_ROLES}"
echo "PROJECTS=${TENANT_PROJECTS}"

echo -e "\n##############################################################################"

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

    #echo -e "\n##############################################################################"
    #echo "=============== CILIUM NETWORK POLICIES "
    ## **************************** 
    ## Deny Egress traffic
    ## **************************** 
    ## replacing TENANT_NAME, TENANT_NAMESPACE, MAIN_DOMAIN_NAME, HARBOR_DOMAIN_NAME
    #tpl -e templates/ciliumNetworkPolicy-deny-egress.yml.tpl > /tmp/ciliumNetworkPolicy-deny-egress.yml
    #echo "/tmp/ciliumNetworkPolicy-deny-egress.yml:"
    #cat /tmp/ciliumNetworkPolicy-deny-egress.yml
    #echo "---------------------------------------------------------------"
    #echo "Creating the Cilium Network Policy [Deny Egress traffic]..."
    #${KUBECTL_CMD} apply -f /tmp/ciliumNetworkPolicy-deny-egress.yml

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
