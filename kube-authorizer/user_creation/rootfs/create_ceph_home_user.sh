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
#   CEPH_FS_VOL_NAME=data
#   DIR_PERSISTENT_SHARED=
#   DIR_DATASETS=
#   DIR_DATA=
#   DIR_PERSISTENT_HOMES=
#   K8S_ENDPOINT= 
#   K8S_TOKEN=



# Initialize ceph configuration file and keyring
tpl -e templates/ceph.conf.tpl > /etc/ceph/ceph.conf
tpl -e templates/ceph.key.tpl > /etc/ceph/ceph.client.${CEPH_ADMIN_USER}.keyring

#----------------------------------------------------------
# USER PERSISTENT HOME 
#----------------------------------------------------------
echo -e "\nCreating directory: ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME} ..."
mkdir -p ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME}
chown 1000:1000 ${MOUNTED_DIR_PERSISTENT_HOMES}/${TENANT_NAME}
echo -e "\n---------------------------------------------------------------"

#----------------------------------------------------------
# CEPH USER
#----------------------------------------------------------
# Create the ceph account for the user
export CEPH_NEW_USER=${CEPH_PREFIX_ACCOUNT}-${TENANT_NAME}
echo -e "\nAuthorise client.${CEPH_NEW_USER} to write in her/his home directory and in the shared directory..."
ceph --user ${CEPH_ADMIN_USER} fs authorize ${CEPH_FS_VOL_NAME} client.${CEPH_NEW_USER} ${DIR_DATASETS} r ${DIR_DATA} r ${DIR_PERSISTENT_HOMES}/${TENANT_NAME} rw ${DIR_PERSISTENT_SHARED} rw
echo -e "\n---------------------------------------------------------------"
echo -e "\nDisplay ceph user created: "
ceph --user ${CEPH_ADMIN_USER} auth get client.${CEPH_NEW_USER}
echo -e "\n---------------------------------------------------------------"
# Obtain the key of the previously created ceph account 
export _NEW_USER_CEPH_KEY=$(ceph --user ${CEPH_ADMIN_USER} auth get-key client.${CEPH_NEW_USER})

#----------------------------------------------------------
# CEPH SECRET
#----------------------------------------------------------
tpl -e templates/ceph-secret.yml.tpl > /tmp/${CEPH_NEW_USER}-secret.yml
echo -e "\n/tmp/${CEPH_NEW_USER}-secret.yml:"
cat /tmp/${CEPH_NEW_USER}-secret.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the ceph-auth secret ..."
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/${CEPH_NEW_USER}-secret.yml
echo -e "\n---------------------------------------------------------------"
