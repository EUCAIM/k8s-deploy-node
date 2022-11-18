apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: "security-context-gid-{{ TENANT_NAME }}"
  annotations:
    chaimeleon/kyverno-policy-name: security-context-gid
    chaimeleon/kyverno-tenant-name: oidc:{{ TENANT_NAME }}
    chaimeleon/kyverno-tenant-type: {{ TENANT_TYPE }}
    policies.kyverno.io/category: Pod Security Standards (Restricted)
    policies.kyverno.io/severity: medium
    policies.kyverno.io/minversion: 1.3.6
    policies.kyverno.io/subject: Pod
    policies.kyverno.io/description: >-
      Ensure user {{ TENANT_NAME }} only can run use her or his GID in supplementalGroups.
spec:
  validationFailureAction: enforce
  background: false
  rules:
    - name: check-supplementalGroups
      match:
        resources:
          kinds:
            - "Pod"
        subjects:
        - kind: User
          name: "oidc:{{ TENANT_NAME }}"
      validate:
        message: >-
          You only can use your assigned GID in spec.securityContext.supplementalGroup.          
        pattern:
          spec:
            =(securityContext):
              =(supplementalGroups): "{{ _NEW_USER_GID }}"

