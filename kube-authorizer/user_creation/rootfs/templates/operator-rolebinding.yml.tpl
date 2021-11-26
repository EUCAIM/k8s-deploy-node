apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: chaimeleon-operator-rolebinding-{{ NEW_USER_NAME }}
  namespace: {{ NEW_USER_NAMESPACE }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: {{ OPERATOR_ROLE_NAME }}
subjects:
  - kind: ServiceAccount
    name: {{ OPERATOR_SERVICE_ACCOUNT }}
    namespace: {{ OPERATOR_NAMESPACE }}