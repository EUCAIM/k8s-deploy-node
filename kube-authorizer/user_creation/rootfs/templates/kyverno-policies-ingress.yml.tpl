apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: "ingress-subpath-{{ NEW_USER_NAMESPACE }}"
  annotations:
    policies.kyverno.io/category: Chaimeleon
    policies.kyverno.io/severity: medium
    policies.kyverno.io/minversion: 1.3.6
    policies.kyverno.io/subject: Pod
    policies.kyverno.io/description: >-
      Ensure user {{ NEW_USER_NAME }} only can run create / update ingress objects using as a root path 
      her / his namespace name.
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
          name: "oidc:{{ NEW_USER_NAME }}"

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
                value: {{ NEW_USER_NAMESPACE }}
        message: >-
          The root path provided ({{request.object.spec.rules[].http.paths[].path |
          to_string(@) | split(@, '/') | [1] }}) must be equal to your namespace ({{ NEW_USER_NAMESPACE }}) 
  validationFailureAction: enforce
