apiVersion: v1
kind: Secret
metadata:
  name: "external-sharing-service-auth"
  namespace: "{{ TENANT_NAMESPACE }}" 
type: Opaque
stringData:
  url: "{{ EXTERNAL_SHARING_SERVICE_ENDPOINT }}"
  token: "{{ API_TOKEN }}"
