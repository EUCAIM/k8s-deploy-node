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

#   GUACAMOLE_ENDPOINT
#   GUACAMOLE_ADMIN_USER
#   GUACAMOLE_ADMIN_PASSWORD

echo "$(date -Iseconds) - Running scripts to delete the user '${TENANT_NAME}'."
echo "ROLES=${TENANT_ROLES}"

if echo ${TENANT_ROLES} | grep -i "data-scientist" > /dev/null; then
    KUBECTL_CMD="kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN}"
    export TENANT_NAMESPACE="user-${TENANT_NAME}"
    echo "NAMESPACE=${TENANT_NAMESPACE}"

    echo -e "\n##############################################################################"
    echo "=============== Remove the user persistent home"
    echo "Moving home directory to: ${MOUNTED_DIR_PERSISTENT_HOMES}/_DELETED/${TENANT_NAME} ..."
    mkdir -p ${MOUNTED_DIR_PERSISTENT_HOMES}/_DELETED
    mv ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME} ${MOUNTED_DIR_PERSISTENT_HOMES}/_DELETED/${TENANT_NAME}
    echo "NOTE: If you want to do permanent deletion, you should delete from _DELETED directory."

    echo -e "\n##############################################################################"
    echo "=============== Delete user of Dataset-service"
    echo "NOTE: The dataset-service does not allow to delete users because they could interact with datasets and participate in traced actions shown in the history."
    echo "      So take into account THE USER IS NOT DELETED FROM DATASET-SERVICE."

    echo -e "\n##############################################################################"
    echo "=============== Delete Guacamole user account and private connections group"
    guacli --url "${GUACAMOLE_ENDPOINT}" --user "${GUACAMOLE_ADMIN_USER}" --password "${GUACAMOLE_ADMIN_PASSWORD}" \
           delete user "${TENANT_NAME}"

    echo -e "\n##############################################################################"
    echo "=============== Delete the namespaced role bindings"
    if ${KUBECTL_CMD} -n zz-shared get rolebinding oidc:${TENANT_NAME}-in-zz-shared-namespace; then
        ${KUBECTL_CMD} -n zz-shared delete rolebinding oidc:${TENANT_NAME}-in-zz-shared-namespace;
    else
        echo rolebinding oidc:${TENANT_NAME}-in-zz-shared-namespace does not exist in namespace zz-shared;
    fi
    echo -e "\n---------------------------------------------------------------"

    echo -e "\n##############################################################################"
    echo "=============== Delete the k8s namespace of the user"
    ${KUBECTL_CMD} delete namespace ${TENANT_NAMESPACE}
fi

echo "End of scripts to delete the user '${TENANT_NAME}'."
