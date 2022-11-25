#!/bin/bash 

set -x

# Environmental variables required:
#   K8S_ENDPOINT 
#   K8S_TOKEN
#   TENANT_TYPE
#   TENANT_NAME
#   TENANT_NAMESPACE
#   KEYCLOAK_CLIENT
#   KEYCLOAK_CLIENT_SECRET
#   KEYCLOAK_ENDPOINT
#   KEYCLOAK_REALM
#   DATASET_SERVICE_ENDPOINT

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


#----------------------------------------------------------
# KYVERNO POLICIES
#----------------------------------------------------------
# **************************** 
# Security context
# **************************** 
tpl -e templates/kyverno-policies-security-context-gid.yml.tpl > /tmp/user-kyverno-policies-security-context-gid.yml
echo -e "\n/tmp/user-kyverno-policies-security-context-gid.yml:"
cat /tmp/user-kyverno-policies-security-context-gid.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the Kyverno policy [Security context]..."
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/user-kyverno-policies-security-context-gid.yml
echo -e "\n---------------------------------------------------------------"

# **************************** 
# Ingress root path
# **************************** 
sed 's/{{ TENANT_TYPE }}/'${TENANT_TYPE}'/g' templates/kyverno-policies-ingress.yml.tpl > /tmp/kyverno_policy_ingress.yml
sed -i 's/{{ TENANT_NAME }}/'${TENANT_NAME}'/g' /tmp/kyverno_policy_ingress.yml
sed -i 's/{{ TENANT_NAMESPACE }}/'${TENANT_NAMESPACE}'/g' /tmp/kyverno_policy_ingress.yml

echo -e "\n---------------------------------------------------------------"
echo -e "/tmp/kyverno_policy_ingress.yml:"
cat /tmp/kyverno_policy_ingress.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the Kyverno policy [Ingress root path] ..."
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/kyverno_policy_ingress.yml
