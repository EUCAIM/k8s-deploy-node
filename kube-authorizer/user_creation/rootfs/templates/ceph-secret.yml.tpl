apiVersion: v1
kind: Secret
metadata:
  name: "ceph-auth"
  namespace: "{{ K8S_NAMESPACE_NEW_USER }}" 
type: Opaque
stringData:
  key: "{{ _NEW_USER_CEPH_KEY }}"
