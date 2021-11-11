apiVersion: v1
kind: Secret
metadata:
  name: "guacamole-api-auth"
  namespace: "{{ K8S_NAMESPACE_NEW_USER }}" 
type: Opaque
stringData:
  user: "{{NEW_USER}}"
  password: "{{ GUACAMOLE_PASSWORD }}"
