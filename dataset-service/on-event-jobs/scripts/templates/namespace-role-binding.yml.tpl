kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: oidc:{{ TENANT_NAME }}-in-user-namespace
  namespace: {{ TENANT_NAMESPACE }}
subjects:
- kind: User
  name: "oidc:{{ TENANT_NAME }}"
- kind: ServiceAccount
  name: default
  namespace: {{ TENANT_NAMESPACE }}
roleRef:
  kind: ClusterRole
  name: oidc:data-scientists-in-user-namespace
  apiGroup: rbac.authorization.k8s.io
