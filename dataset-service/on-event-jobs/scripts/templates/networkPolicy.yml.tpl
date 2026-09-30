apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-tenant-traffic
  namespace: {{ TENANT_NAMESPACE }}
spec:
  podSelector: {}   # This policy applies to all pods in this namespace

  # All traffic is blocked just defining the sections ingress/egress 
  # except the traffic allowed by the rules defined in each section.
  policyTypes:
    - Ingress
    - Egress

  ingress: # Inbound exception rules (white list)
    - from:
        - namespaceSelector:   # From pods in the listed namespaces
            matchExpressions:
              - key: kubernetes.io/metadata.name
                operator: In
                values:
                  - {{ TENANT_NAMESPACE }}   # From any pod in the same namespace
                  - guacamole     # From Guacamole service to VNC/RDP service

  egress: # Outbound exception rules (white list)
    - to:
        - namespaceSelector:   # To pods in the listed namespaces
            matchExpressions:
              - key: kubernetes.io/metadata.name
                operator: In
                values:
                  - {{ TENANT_NAMESPACE }}   # To any pod in the same namespace
                  - jobman-service    # For the command jobman to work
                  - package-repos-proxy   # For the command pip to work
                  - clinical-data-sql-db   # For the ETL app to work
                  - orthanc    # For uploading modified images to the datalake (e.g. after segmentation or armonisation)

    - to:   # For connecting to any of the services exposed in the public domain through ingress-nginx.
            # Depending on the CoreDNS configuration, internal connections to this public domain may be resolved
            # to the public IP address or to the local IP address. In case of doubt put both.
            # It is particularly required for accessing datasets-service web 
            # for creating new versions of dataset (e.g. after the ETL process).
        - ipBlock:
            cidr: 192.168.1.162/32
        - ipBlock:
            cidr: 158.42.106.140/32
      ports:
        - port: 443
        - port: 80
        # Note port 6443 is not included to avoid connections to kube-apiserver

    - to:   # Explicitly allow DNS traffic to CoreDNS in kube-system
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
