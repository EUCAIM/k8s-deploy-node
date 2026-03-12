#!/bin/bash 

# Echo all commands before execute
#set -x
# Interrupt and exit on any error
set -e

# Environmental variables required:
#   TENANT_NAME
#   TENANT_ROLES
#   K8S_ENDPOINT
#   K8S_TOKEN

#   MOUNTED_DIR_PERSISTENT_HOMES
#   CEPH_HOST
#   CEPH_PREFIX_ACCOUNT
#   CEPH_ADMIN_USER
#   CEPH_ADMIN_KEY

#   GUACAMOLE_ENDPOINT
#   GUACAMOLE_ADMIN_USER
#   GUACAMOLE_ADMIN_PASSWORD

echo "$(date -Iseconds) - Running scripts to delete the user '${TENANT_NAME}'."
echo "ROLES=${TENANT_ROLES}"

if echo ${TENANT_ROLES} | grep -i "data-scientist" > /dev/null; then
    KUBECTL_CMD="kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN}"
    export TENANT_NAMESPACE="user-${TENANT_NAME}"
    echo "NAMESPACE=${TENANT_NAMESPACE}"
    
    # Initialize ceph configuration file and keyring
    # replacing CEPH_HOST
    tpl -e templates/ceph.conf.tpl > /etc/ceph/ceph.conf
    # replacing CEPH_ADMIN_USER, CEPH_ADMIN_KEY
    tpl -e templates/ceph.key.tpl > /etc/ceph/ceph.client.${CEPH_ADMIN_USER}.keyring

    echo -e "\n##############################################################################"
    echo "=============== Remove the user persistent home"
    echo "Moving home directory to: ${MOUNTED_DIR_PERSISTENT_HOMES}/_DELETED/${TENANT_NAME} ..."
    mkdir -p ${MOUNTED_DIR_PERSISTENT_HOMES}/_DELETED
    mv ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME} ${MOUNTED_DIR_PERSISTENT_HOMES}/_DELETED/${TENANT_NAME}
    echo "NOTE: If you want to do permanent deletion, you should delete from _DELETED directory."

    echo -e "\n##############################################################################"
    echo "=============== Delete the ceph account of the user"
    export CEPH_USER=${CEPH_PREFIX_ACCOUNT}--${TENANT_NAME}
    echo "Deleting client.${CEPH_USER}..."
    ceph --user ${CEPH_ADMIN_USER} auth rm client.${CEPH_USER}

    # The entire user namespace will deleted, so this block is not really needed.
    # #----------------------------------------------------------
    # # CEPH SECRET
    # #----------------------------------------------------------
    # echo -e "\n---------------------------------------------------------------"
    # echo -e "\Deleting the ceph-auth secret ..."
    # ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} delete secret ceph-auth
    # echo -e "\n---------------------------------------------------------------"

    echo -e "\n##############################################################################"
    echo "=============== Delete user of Dataset-service"
    echo "NOTE: The dataset-service does not allow to delete users because they could interact with datasets and participate in traced actions shown in the history."
    echo "      So take into account THE USER IS NOT DELETED FROM DATASET-SERVICE."

    # The entire user namespace will deleted, so this block is not really needed.
    # #----------------------------------------------------------
    # # USER CONFIGMAP
    # #----------------------------------------------------------
    # echo -e "\nDeleting the user-configmap  ... "
    # if ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} get configmap chaimeleon; then
    #     ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} delete configmap chaimeleon;
    # else
    #     echo configmap chaimeleon does not exist in namespace ${TENANT_NAMESPACE};
    # fi
    # echo -e "\n---------------------------------------------------------------"

    # The entire user namespace will deleted, so this block is not really needed.
    # #----------------------------------------------------------
    # # KYVERNO POLICIES
    # #----------------------------------------------------------
    # echo -e "\nDeleting the kyverno policies... "
    # if ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} get Policy security-context-gid-${TENANT_NAME}; then
    #     ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} delete Policy security-context-gid-${TENANT_NAME};
    # else
    #     echo Policy security-context-gid-${TENANT_NAME} does not exist in namespace ${TENANT_NAMESPACE};
    # fi;
    # if ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} get Policy ingress-subpath-${TENANT_NAME}; then
    #     ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} delete Policy ingress-subpath-${TENANT_NAME};
    # else
    #     echo Policy ingress-subpath-${TENANT_NAME} does not exist in namespace ${TENANT_NAMESPACE};
    # fi

    echo -e "\n##############################################################################"
    echo "=============== Delete Guacamole user account and private connections group"
    guacli --url "${GUACAMOLE_ENDPOINT}" --user "${GUACAMOLE_ADMIN_USER}" --password "${GUACAMOLE_ADMIN_PASSWORD}" \
           delete user "${TENANT_NAME}"

    # The entire user namespace will deleted, so this block is not really needed.
    # #----------------------------------------------------------
    # # GUACAMOLE SECRET
    # #----------------------------------------------------------
    # echo -e "\n---------------------------------------------------------------"
    # echo -e "\nDeleting the guacamole-secret ... "
    # ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} delete secret guacamole-api-auth
    # echo -e "\n---------------------------------------------------------------"

    # The entire user namespace will deleted, so this block is not really needed.
    # #----------------------------------------------------------
    # # CILIUM NETWORK POLICIES
    # #----------------------------------------------------------
    # if ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} get CiliumNetworkPolicy deny-egress-${TENANT_NAME}; then 
    #     ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} delete CiliumNetworkPolicy deny-egress-${TENANT_NAME};
    # else
    #     echo CiliumNetworkPolicy deny-egress-${TENANT_NAME} does not exist in namespace ${TENANT_NAMESPACE};
    # fi

    # That binding was not created because the binding is done for the group "oidc:data-scientists".
    # echo -e "\n##############################################################################"
    # echo "=============== Delete the cluster role binding"
    # python3 delete_clusterrolebinding.py ${K8S_ENDPOINT} ${K8S_TOKEN} ${TENANT_TYPE} oidc:${TENANT_NAME} chaimeleon-users-role-cluster

    # The entire user namespace will be deleted, so this block is not really needed.
    # echo -e "\n##############################################################################"
    # echo "=============== Delete the namespaced role bindings"
    # #  python3 delete_rolebinding.py ${K8S_ENDPOINT} ${K8S_TOKEN} ${TENANT_TYPE} oidc:${TENANT_NAME} ${TENANT_NAMESPACE} chaimeleon-users-role-namespace
    # #That method to remove is dangerous because some rolebinding for this user can include other users.
    # #It is better to delete de rolebinding by name:
    # if ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} get rolebinding oidc:${TENANT_NAME}; then
    #     ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} delete rolebinding oidc:${TENANT_NAME};
    # else
    #     echo rolebinding oidc:${TENANT_NAME} does not exist in namespace ${TENANT_NAMESPACE};
    # fi
    # echo -e "\n---------------------------------------------------------------"


    # The entire user namespace will be deleted, so this block is not really needed.
    # #----------------------------------------------------------
    # # EXTERNAL SHARING SERVICE SECRET
    # #----------------------------------------------------------
    # echo -e "\n---------------------------------------------------------------"
    # echo -e "\Deleting the external-sharing-service-auth secret ..."
    # ${KUBECTL_CMD} -n ${TENANT_NAMESPACE} delete secret external-sharing-service-auth
    # echo -e "\n---------------------------------------------------------------"

    echo -e "\n##############################################################################"
    echo "=============== Delete the k8s namespace of the user"
    ${KUBECTL_CMD} delete namespace ${TENANT_NAMESPACE}

fi

echo "End of scripts to delete the user '${TENANT_NAME}'."
