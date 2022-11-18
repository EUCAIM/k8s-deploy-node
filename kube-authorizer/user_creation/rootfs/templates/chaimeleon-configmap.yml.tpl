apiVersion: v1
kind: ConfigMap
metadata:
  name: chaimeleon
  namespace: "{{ TENANT_NAMESPACE }}" 
data:
  datasets.path: "{{ DIR_DATASETS }}"
  datasets.mount_point: "/home/chaimeleon/datasets"
  datalake.path: "{{ DIR_DATA }}"
  datalake.mount_point: "/mnt/rootfs"
  persistent_home.path: "{{ DIR_PERSISTENT_HOMES }}/{{ TENANT_NAME }}"
  persistent_home.mount_point: "/home/chaimeleon/persistence" 
  persistent_shared_folder.path: "{{ DIR_PERSISTENT_SHARED }}"
  persistent_shared_folder.mount_point: "/home/chaimeleon/persistent-shared-folder"

  user.uid: "1000"
  user.name: chaimeleon
  group.name: chaimeleon
  group.gid: "1000"
  
  ceph.user: "{{ CEPH_NEW_USER }}"
  ceph.gid: "{{ _NEW_USER_GID }}"
  ceph.monitor: "{{ CEPH_HOST }}:6789" 
  