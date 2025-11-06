apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: deny-egress-{{ TENANT_NAME }}
  namespace: {{ TENANT_NAMESPACE }}
spec:
  endpointSelector: {}
  egress:
    - toEndpoints:
        - {}
    - toEntities:
        - cluster
    - toEndpoints:
        - matchLabels:
            io.kubernetes.pod.namespace: kube-system
            k8s-app: kube-dns
      toPorts:
        - ports:
            - port: "53"
              protocol: UDP
          rules:
            dns:
              - matchPattern: "*"
    - toFQDNs:
        - matchName: {{ MAIN_DOMAIN_NAME }}
    - toFQDNs:
        - matchName: {{ HARBOR_DOMAIN_NAME }}
