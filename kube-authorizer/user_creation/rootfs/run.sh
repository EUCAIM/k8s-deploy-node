#!/bin/bash 

#set -x
# Environmental variables required:
#   NEW_USER=
#   MOUNTED_DIR_PERSISTENT_HOMES= # Mount only at the container only the persistent homes directory from CephFS 
#   CEPH_HOST=
#   CEPH_PREFIX_ACCOUNT=chaimeleon-user
#   CEPH_ADMIN_USER=
#   CEPH_ADMIN_KEY=
#   CEPH_POOL_DATA=
#   DIR_PERSISTENT_HOMES=
#   DIR_DATASETS=
#   DIR_DATA=
#   K8S_ENDPOINT= 
#   K8S_TOKEN=
#   K8S_NAMESPACE_NEW_USER=


# Create PERSISTENT HOME for the user
echo "Creating directory: ${MOUNTED_DIR_PERSISTENT_HOMES}/${NEW_USER}"
mkdir -p ${MOUNTED_DIR_PERSISTENT_HOMES}/${NEW_USER}

# Initialize ceph configuration file and keyring
tpl -e templates/ceph.conf.tpl > /etc/ceph/ceph.conf
tpl -e templates/ceph.key.tpl > /etc/ceph/ceph.client.${CEPH_ADMIN_USER}.keyring


CEPH_NEW_USER=${CEPH_PREFIX_ACCOUNT}-${NEW_USER}
echo "Creating new ceph user: client.${CEPH_NEW_USER}"
# Create the ceph account for the user
ceph --user ${CEPH_ADMIN_USER} auth get-or-create client.${CEPH_NEW_USER} mon "allow r" mds "allow rw path="${DIR_PERSISTENT_HOMES}/${NEW_USER}", allow r path="${DIR_DATASETS}", allow r path="${DIR_DATA} osd "allow rw pool="${CEPH_POOL_DATA}""

# Display ceph user created
ceph --user ${CEPH_ADMIN_USER} auth get client.${CEPH_NEW_USER}

# Obtain the key of the previously created ceph account 
export _NEW_USER_CEPH_KEY=$(ceph --user ${CEPH_ADMIN_USER} auth get-key client.${CEPH_NEW_USER})

# Create k8s objects
tpl -e templates/ceph-secret.yml.tpl > /tmp/${CEPH_NEW_USER}-secret.yml
echo "Creating the ceph-secret: "
cat /tmp/${CEPH_NEW_USER}-secret.yml
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/${CEPH_NEW_USER}-secret.yml

# Create Guacamole 