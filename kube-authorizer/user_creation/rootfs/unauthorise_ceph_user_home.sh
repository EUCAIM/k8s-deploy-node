#!/bin/bash 

set -x

# Environmental variables required:
#   TENANT_NAME=          
#   TENANT_NAMESPACE=      
#   MOUNTED_DIR_PERSISTENT_HOMES= # Mount only at the container only the persistent homes directory from CephFS 
#   CEPH_HOST=
#   CEPH_PREFIX_ACCOUNT=chaimeleon
#   CEPH_ADMIN_USER=
#   CEPH_ADMIN_KEY=
#   DIR_PERSISTENT_SHARED=
#   K8S_ENDPOINT= 
#   K8S_TOKEN=



# Initialize ceph configuration file and keyring
tpl -e templates/ceph.conf.tpl > /etc/ceph/ceph.conf
tpl -e templates/ceph.key.tpl > /etc/ceph/ceph.client.${CEPH_ADMIN_USER}.keyring

#----------------------------------------------------------
# USER PERSISTENT HOME 
#----------------------------------------------------------
#echo -e "\Deleting directory: ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME} ..."
#echo -e "\n---------------------------------------------------------------"

#----------------------------------------------------------
# CEPH USER
#----------------------------------------------------------
# Create the ceph account for the user
echo -e "\n---------------------------------------------------------------"
export CEPH_NEW_USER=${CEPH_PREFIX_ACCOUNT}-${TENANT_NAME}
echo -e "\Deleting client.${CEPH_NEW_USER}..."
ceph --user ${CEPH_ADMIN_USER} auth rm client.${CEPH_NEW_USER}
echo -e "\n---------------------------------------------------------------"

#----------------------------------------------------------
# CEPH SECRET
#----------------------------------------------------------
echo -e "\n---------------------------------------------------------------"
echo -e "\Deleting the ceph-auth secret ..."
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} -n ${TENANT_NAMESPACE} delete secret ceph-auth
echo -e "\n---------------------------------------------------------------"

