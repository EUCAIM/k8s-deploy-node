apiVersion: v1
kind: Secret
metadata:
  name: "ceph-auth"
  namespace: "{{ TENANT_NAMESPACE }}" 
type: Opaque
stringData:
  key: "{{ _NEW_USER_CEPH_KEY }}"
