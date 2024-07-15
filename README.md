# Services running in EUCAIM UPV reference node:

Authentication:
- Keycloak: deployed using plain YAMLs.  
   - Admin console URL: https://eucaim-node.i3m.upv.es/auth  
   - User profile URL: https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/account  
   - OIDC discovery endpoint: https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/.well-known/openid-configuration  
   - Deployment details in the [keycloak directory](/keycloak/)

Authorization:
- [Kube-authorizer](https://gitlab.com/primageproject/kube-authorizer): deployed using plain YAMLs.

Security Policy Management System:
- [Kyverno](https://kyverno.github.io/kyverno/): deployed using the Helm Chart. Pod Security Standard Policy: _baseline_. Other applied policies availables [here](https://github.com/eucaim/k8s-deploy-node/tree/master/kyverno/policies).

Repository for container images and helm charts:
- Harbor: deployed using the official helm chart.  
   - Web UI URL: https://harbor.eucaim-node.i3m.upv.es
   - Deployment details in the [harbor directory](/harbor/)

Interact with Kubernetes:
- Kubeapps: deployed using plain YAMLs.  
   - URL: https://eucaim-node.i3m.upv.es/apps/
   - Deployment details in the [kubeapps directory](/kubeapps/)
- Kubernetes Dashboard: deployed using the official helm chart.  
   - URL: https://eucaim-node.i3m.upv.es/apps/k8s-dashboard/  
   - Deployment details [here](/infrastructure-recipes/#k8s-dashboard)

Access to interactive applications:
- Guacamole: deployed using the helm chart. URL: https://eucaim-node.i3m.upv.es/guacamole/

Ingestion service and datalake explorer:
- QP-Insights: deployed using the [helm chart](https://github.com/chaimeleon-eu/k8s_quibimprecision). 
   - URL: https://eucaim-node.i3m.upv.es/.../

Dataset administration and Traceability System:
- Dataset-service: deployed using plain YAMLs.
   - URL: https://eucaim-node.i3m.upv.es/dataset-service  
   - Deployment details in the [dataset-service directory](/dataset-service/)
   - (https://github.com/chaimeleon-eu/dataset-service)
- [Chaimeleon K8s Operator](https://github.com/chaimeleon-eu/k8s-chaimeleon-operator): deployed using the Helm Chart. 
- [Tracer Service](https://github.com/chaimeleon-eu/tracer). 

Authentication proxy:
- OAuth2-proxy: deployed using the helm chart. URL: https://eucaim-node.i3m.upv.es/oauth2p/


## Deployment order
First of all, go to the infrastructure recipes to create the infrastructure (a Kubernetes cluster) in a cloud provider
and deploy some infrastructure core services:  
[infrastructure-recipes](/infrastructure-recipes/)
There are the details to deploy:
 - Kubernetes cluster
 - Ceph storage provisioner
 - Ingress nginx
 - Cert-manager
 - Kubernetes dashboard

Now the platform core services can be deployed in the following order to properly satisfy dependencies:
 | Name                                | Dependecies (not hard dependency, just required for some function) |
 |-------------------------------------|--------------------------------------------------------------------|
 | Keycloak                            |                                                                    |
 | Harbor                              | Depends on Keycloak                                                |
 | Kubeapps                            | Depends on Keycloak, Harbor                                        |
 | Access to K8s dashboard with OIDC   | Depends on Keycloak, Kubeapps                                      |
 | Tracer-service                      | Depends on Keycloak, Harbor                                        |
 | Dataset-service                     | Depends on Keycloak, Harbor, (Tracer), (Kubeapps)                  |
 | QP-Insights                         | Depends on Keycloak, Harbor, (Dataset-service)                     |
 | Guacamole                           | Depends on Keycloak, Harbor                                        |
 | Kube-authorizer                     | Depends on Keycloak, Harbor, Dataset-service, Guacamole            |
 | Chaimeleon K8s Operator             | Depends on Keycloak, Harbor, Dataset-service, Guacamole            |
 | Jobman-service                      | Depends on Keycloak, Harbor, Chaimeleon K8s Operator               |

Finally...
[extra-configurations](/extra-configurations/)
