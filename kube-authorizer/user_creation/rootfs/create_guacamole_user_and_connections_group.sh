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
# Create Guacamole user to access to the REST API and a private connections group for the user
export GUACAMOLE_PASSWORD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-16};echo;)
echo -e "\nCreating the guacamole user and connections group ..."
python3 createGuacamoleUserAndConnectionsGroup.py --url "${GUACAMOLE_ENDPOINT}" \
                                                 --admin-user ${GUACAMOLE_ADMIN_USER} --admin-password "${GUACAMOLE_ADMIN_PASSWORD}" \
                                                 --user "${TENANT_NAME}" --password "${GUACAMOLE_PASSWORD}"

#----------------------------------------------------------
# GUACAMOLE SECRET
#----------------------------------------------------------
# Store the credentials in a secret
tpl -e templates/guacamole-secret.yml.tpl > /tmp/guacamole-api-user-${TENANT_NAME}-secret.yml
echo -e "\n/tmp/guacamole-api-user-${TENANT_NAME}-secret.yml: "
cat /tmp/guacamole-api-user-${TENANT_NAME}-secret.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the guacamole-secret ... "
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/guacamole-api-user-${TENANT_NAME}-secret.yml
echo -e "\n---------------------------------------------------------------"
