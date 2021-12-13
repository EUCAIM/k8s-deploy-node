#!/bin/bash 

#set -x

# Environmental variables required:
#   NEW_USER=
#   NEW_USER_NAME=
#   NEW_USER_ID=
#   NEW_USER_NAMESPACE=
#   MOUNTED_DIR_PERSISTENT_HOMES= # Mount only at the container only the persistent homes directory from CephFS 
#   CEPH_HOST=
#   CEPH_PREFIX_ACCOUNT=chaimeleon-user
#   CEPH_ADMIN_USER=
#   CEPH_ADMIN_KEY=
#   CEPH_POOL_DATA=
#   DIR_PERSISTENT_SHARED=
#   DIR_PERSISTENT_HOMES=
#   DIR_DATASETS=
#   DIR_DATA=
#   K8S_ENDPOINT= 
#   K8S_TOKEN=
#   K8S_NAMESPACE_NEW_USER=
#   KEYCLOAK_ENDPOINT= 
#   KEYCLOAK_REALM= 
#   DATASET_SERVICE_ENDPOINT=
#   KEYCLOAK_CLIENT=
#   KEYCLOAK_CLIENT_SECRET=
#   GUACAMOLE_ENDPOINT=
#   GUACAMOLE_ADMIN_USER=
#   GUACAMOLE_ADMIN_PASSWORD=
#   OPERATOR_SERVICE_ACCOUNT=
#   OPERATOR_NAMESPACE=
#   OPERATOR_ROLE_NAME=

# Initialize ceph configuration file and keyring
tpl -e templates/ceph.conf.tpl > /etc/ceph/ceph.conf
tpl -e templates/ceph.key.tpl > /etc/ceph/ceph.client.${CEPH_ADMIN_USER}.keyring


#-----------------------------
# USER PERSISTENT HOME 
#-----------------------------
echo -e "\nCreating directory: ${MOUNTED_DIR_PERSISTENT_HOMES}/${NEW_USER} ..."
mkdir -p ${MOUNTED_DIR_PERSISTENT_HOMES}/${NEW_USER}
echo -e "\n---------------------------------------------------------------"

#-----------------------------
# CEPH USER
#-----------------------------
# Create the ceph account for the user
export CEPH_NEW_USER=${CEPH_PREFIX_ACCOUNT}-${NEW_USER}
echo -e "\nCreating new ceph user: client.${CEPH_NEW_USER} ..."
ceph --user ${CEPH_ADMIN_USER} auth get-or-create client.${CEPH_NEW_USER} mon "allow r" mds "allow rw path="${DIR_PERSISTENT_HOMES}/${NEW_USER}", allow rw path="${DIR_PERSISTENT_SHARED}", allow r path="${DIR_DATASETS}", allow r path="${DIR_DATA} osd "allow rw pool="${CEPH_POOL_DATA}""
echo -e "\n---------------------------------------------------------------"
echo -e "\nDisplay ceph user created: "
ceph --user ${CEPH_ADMIN_USER} auth get client.${CEPH_NEW_USER}
echo -e "\n---------------------------------------------------------------"
# Obtain the key of the previously created ceph account 
export _NEW_USER_CEPH_KEY=$(ceph --user ${CEPH_ADMIN_USER} auth get-key client.${CEPH_NEW_USER})

#-----------------------------
# CEPH SECRET
#-----------------------------
tpl -e templates/ceph-secret.yml.tpl > /tmp/${CEPH_NEW_USER}-secret.yml
echo -e "\n/tmp/${CEPH_NEW_USER}-secret.yml:"
cat /tmp/${CEPH_NEW_USER}-secret.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the ceph-auth secret ..."
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/${CEPH_NEW_USER}-secret.yml
echo -e "\n---------------------------------------------------------------"

#-----------------------------
# OPERATOR ROLEBINDING
#-----------------------------
# tpl -e templates/operator-rolebinding.yml.tpl > /tmp/${CEPH_NEW_USER}-operator-rolebinding.yml
# echo -e "\n/tmp/${CEPH_NEW_USER}-operator-rolebinding.yml:"
# cat /tmp/${CEPH_NEW_USER}-operator-rolebinding.yml
# echo -e "\n---------------------------------------------------------------"
# echo -e "\nCreating operator rolebinding ..."
# kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/${CEPH_NEW_USER}-operator-rolebinding.yml
# echo -e "\n---------------------------------------------------------------"

#-----------------------------
# CREATE USER DATASET SERVICE
#-----------------------------
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
curl -X GET -H "Authorization: bearer ${_DATASET_AUTH_TOKEN}" -H "Content-Type: application/json" "${DATASET_SERVICE_ENDPOINT}/api/user/${NEW_USER_NAME}" > /tmp/user-info.json
echo -e "\n    .............    "
echo -e "\nResponse: "
cat /tmp/user-info.json
echo -e "\n---------------------------------------------------------------"
export _NEW_USER_GID=$(jq -r .gid /tmp/user-info.json )

#-----------------------------
# CHAIMELEON CONFIGMAP
#-----------------------------
tpl -e templates/chaimeleon-configmap.yml.tpl > /tmp/user-${_NEW_USER_GID}-chaimeleon-configmap.yml
echo -e "\n/tmp/user-${_NEW_USER_GID}-chaimeleon-configmap.yml:"
cat /tmp/user-${_NEW_USER_GID}-chaimeleon-configmap.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the chaimeleon-configmap  ... "
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/user-${_NEW_USER_GID}-chaimeleon-configmap.yml
echo -e "\n---------------------------------------------------------------"

#-----------------------------
# KYVERNO POLOCIES
#-----------------------------
tpl -e templates/kyverno-policies.yml.tpl > /tmp/user-${_NEW_USER_GID}-kyverno-policies.yml
echo -e "\n/tmp/user-${_NEW_USER_GID}-kyverno-policies.yml:"
cat /tmp/user-${_NEW_USER_GID}-kyverno-policies.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the Kyverno policy ..."
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/user-${_NEW_USER_GID}-kyverno-policies.yml
echo -e "\n---------------------------------------------------------------"

#-----------------------------
# GUACAMOLE USER 
#-----------------------------
# Create Guacamole user to access to the REST API and a private connections group for the user
export GUACAMOLE_PASSWORD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-16};echo;)
echo -e "\nCreating the guacamole user and connections group ..."
python3 createGuacamoleUserAndConnectionsGroup.py --url "${GUACAMOLE_ENDPOINT}" \
                                                 --admin-user ${GUACAMOLE_ADMIN_USER} --admin-password "${GUACAMOLE_ADMIN_PASSWORD}" \
                                                 --user "${NEW_USER}" --password "${GUACAMOLE_PASSWORD}"

#-----------------------------
# GUACAMOLE SECRET
#-----------------------------
# Store the credentials in a secret
tpl -e templates/guacamole-secret.yml.tpl > /tmp/guacamole-api-user-${NEW_USER}-secret.yml
echo -e "\n/tmp/guacamole-api-user-${NEW_USER}-secret.yml: "
cat /tmp/guacamole-api-user-${NEW_USER}-secret.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the guacamole-secret ... "
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/guacamole-api-user-${NEW_USER}-secret.yml
echo -e "\n---------------------------------------------------------------"
