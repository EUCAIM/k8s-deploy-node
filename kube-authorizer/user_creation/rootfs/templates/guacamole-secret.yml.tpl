apiVersion: v1
kind: Secret
metadata:
  name: "guacamole-api-auth"
  namespace: "{{ TENANT_NAMESPACE }}" 
type: Opaque
stringData:
  user: "{{ TENANT_NAME }}"
  password: "{{ GUACAMOLE_PASSWORD }}"
