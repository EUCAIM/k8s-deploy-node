apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: "ingress-subpath-{{ TENANT_NAMESPACE }}"
  annotations:
    chaimeleon/kyverno-policy-name: ingress-subpath
    chaimeleon/kyverno-tenant-name: oidc:{{ TENANT_NAME }}
    chaimeleon/kyverno-tenant-type: {{ TENANT_TYPE }}
    policies.kyverno.io/category: Chaimeleon
    policies.kyverno.io/severity: medium
    policies.kyverno.io/minversion: 1.3.6
    policies.kyverno.io/subject: Pod
    policies.kyverno.io/description: >-
      Ensure user {{ TENANT_NAME }} only can run create / update ingress objects using as a root path her / his namespace name ({{ TENANT_NAMESPACE }}).
spec:
  validationFailureAction: enforce
  background: false
  rules:
    - name: check-ingress-subpath
      match:
        resources:
          kinds:
            - "Ingress"
        subjects:
        - kind: User
          name: "oidc:{{ TENANT_NAME }}"

      preconditions:
        any:
        - key: "{{ request.operation }}"
          operator: Equals
          value: CREATE
        - key: "{{ request.operation }}"
          operator: Equals
          value: UPDATE
      validate:
        deny:
          conditions:
            all:
              - key: >-
                  {{request.object.spec.rules[].http.paths[].path | to_string(@)
                  | split(@, '/') | [1]}}
                operator: NotEquals
                value: {{ TENANT_NAMESPACE }}
        message: >-
          The root path provided ({{request.object.spec.rules[].http.paths[].path |
          to_string(@) | split(@, '/') | [1] }}) must be equal to your namespace ({{ TENANT_NAMESPACE }}) 
  validationFailureAction: enforce
