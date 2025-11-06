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

---
# This is for give permission to the default user's service account (used by jobman to access k8s) to read configmaps in the namespace "zz-shared".
# It is used by jobman to get the list of jobs in queue, which is stored periodically by a cronjob in a configmap in that namespace.
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: oidc:{{ TENANT_NAME }}-in-zz-shared-namespace
  namespace: zz-shared
subjects:
- kind: User
  name: "oidc:{{ TENANT_NAME }}"
- kind: ServiceAccount
  name: default
  namespace: {{ TENANT_NAMESPACE }}
roleRef:
  kind: ClusterRole
  name: oidc:data-scientists-in-zz-shared-namespace
  apiGroup: rbac.authorization.k8s.io
