apiVersion: v1
kind: Secret
metadata:
  name: "jobman-service-auth"
  namespace: "{{ TENANT_NAMESPACE }}" 
type: Opaque
stringData:
  token: "{{ API_TOKEN }}"
