#!/bin/bash 

set -x

# Environmental variables required:
#   TENANT_NAME=
#   TENANT_NAMESPACE= 
#   GUACAMOLE_ENDPOINT=
#   GUACAMOLE_ADMIN_USER=
#   GUACAMOLE_ADMIN_PASSWORD=
#   K8S_ENDPOINT= 
#   K8S_TOKEN=



#----------------------------------------------------------
# GUACAMOLE USER 
#----------------------------------------------------------
# Delete Guacamole user and a private connections group for the user
echo -e "\nDeleting the guacamole user and connections group ..."
#python3 createGuacamoleUserAndConnectionsGroup.py --url "${GUACAMOLE_ENDPOINT}" \
#                                                 --admin-user ${GUACAMOLE_ADMIN_USER} --admin-password "${GUACAMOLE_ADMIN_PASSWORD}" \
#                                                 --user "${TENANT_NAME}" --password "${GUACAMOLE_PASSWORD}"

#----------------------------------------------------------
# GUACAMOLE SECRET
#----------------------------------------------------------
echo -e "\n---------------------------------------------------------------"
echo -e "\nDeleting the guacamole-secret ... "
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} -n ${TENANT_NAMESPACE} delete secret guacamole-api-auth
echo -e "\n---------------------------------------------------------------"
