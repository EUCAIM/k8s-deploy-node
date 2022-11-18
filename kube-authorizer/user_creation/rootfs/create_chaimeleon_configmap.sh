#!/bin/bash 

set -x

# Environmental variables required:
#   TENANT_NAME=
#   TENANT_NAMESPACE= 
#   DIR_PERSISTENT_SHARED=
#   DIR_PERSISTENT_HOMES=
#   DIR_DATASETS=
#   DIR_DATA=
#   KEYCLOAK_ENDPOINT= 
#   KEYCLOAK_REALM= 
#   DATASET_SERVICE_ENDPOINT=
#   KEYCLOAK_CLIENT=
#   KEYCLOAK_CLIENT_SECRET=
#   CEPH_HOST
#----------------------------------------------------------
# CREATE USER DATASET SERVICE
#----------------------------------------------------------
# Obtain AUTH token from keycloak
echo -e "\nObtaining AUTH token from keycloak ..."
curl -d "grant_type=client_credentials" -d "client_id=${KEYCLOAK_CLIENT}" -d "client_secret=${KEYCLOAK_CLIENT_SECRET}" "${KEYCLOAK_ENDPOINT}/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token" > /tmp/auth-token.json
echo -e "\n    .............    "
echo -e "\nResponse: "
cat /tmp/auth-token.json 
echo -e "\n---------------------------------------------------------------"
export _DATASET_AUTH_TOKEN=$(jq -r .access_token /tmp/auth-token.json )

# Obtain the new UID for the user from dataset service
echo -e "\nObtaining the new UID for the user from dataset service ..."
curl -X GET -H "Authorization: bearer ${_DATASET_AUTH_TOKEN}" -H "Content-Type: application/json" "${DATASET_SERVICE_ENDPOINT}/api/users/${TENANT_NAME}" > /tmp/user-info.json
echo -e "\n    .............    "
echo -e "\nResponse: "
cat /tmp/user-info.json
echo -e "\n---------------------------------------------------------------"
export _NEW_USER_GID=$(jq -r .gid /tmp/user-info.json )

export CEPH_NEW_USER=${CEPH_PREFIX_ACCOUNT}-${TENANT_NAME}

#----------------------------------------------------------
# CHAIMELEON CONFIGMAP
#----------------------------------------------------------
tpl -e templates/chaimeleon-configmap.yml.tpl > /tmp/chaimeleon-configmap.yml
echo -e "\n/tmp/chaimeleon-configmap.yml:"
cat /tmp/chaimeleon-configmap.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the chaimeleon-configmap  ... "
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/chaimeleon-configmap.yml
echo -e "\n---------------------------------------------------------------"
