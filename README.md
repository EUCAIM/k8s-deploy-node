# Services running in EUCAIM UPV reference node:

Authentication:
- Keycloak: deployed using plain YAMLs.  
   - Admin console URL: https://eucaim-node.i3m.upv.es/auth  
   - User profile URL: https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/account  
   - OIDC discovery endpoint: https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/.well-known/openid-configuration  
   - Deployment details in the [keycloak directory](/keycloak/)

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
   - Source code: https://github.com/chaimeleon-eu/dataset-service
- [DSWS K8s Operator](https://github.com/chaimeleon-eu/k8s-chaimeleon-operator): deployed using the Helm Chart. 
- [Tracer Service](https://github.com/chaimeleon-eu/tracer). 

Authentication proxy:
- OAuth2-proxy: deployed using the helm chart. URL: https://eucaim-node.i3m.upv.es/oauth2p/

Package Repositories (like for Python's pip, or Java's maven):
- Devpi: deployed using plain YAMLs
   - URL (Platform internal only): http://devpi-service.package-repos-proxy:3141
   - Deployment details in the [devpi directory](/devpi/)

Job management:
- Jobman service: deployed using plain YAMLs
   - URL: https://eucaim-node.i3m.upv.es/jobman-service
   - Deployment details in the [jobman-service directory](/jobman-service/)
   - Source code: [https://github.com/EUCAIM/jobman](https://github.com/EUCAIM/jobman)

## Deployment order
First of all, go to the infrastructure recipes to create the infrastructure (a Kubernetes cluster) in a cloud provider
and deploy some infrastructure core services: [infrastructure-recipes](/infrastructure-recipes/)  
Those are the basic components deployed:
 - Kubernetes cluster with cilium network and nvidia GPU operator
 - Ceph storage provisioner (ceph-csi)
 - Ingress nginx
 - Cert-manager
 - Kubernetes dashboard

Now the platform core services can be deployed in the following order to properly satisfy dependencies:
 | Name                              | Dependecies (not hard dependency, just required for some function) | Deployment details                             
 |-----------------------------------|--------------------------------------------------------------------|------------------------------------------------
 | Keycloak                          |                                                                    | [keycloak directory](/keycloak/)
 | Harbor                            | Depends on Keycloak                                                | [harbor directory](/harbor/)
 | Devpi                             | Depends on Harbor                                                  | [devpi directory](/devpi/)
 | Kubeapps                          | Depends on Keycloak, Harbor                                        | [kubeapps directory](/kubeapps/)
 | Access to K8s dashboard with OIDC | Depends on Keycloak, Kubeapps                                      | [kubernetes-dashboard-oidc-access directory](/kubernetes-dashboard-oidc-access/)
 | Tracer-service                    | Depends on Keycloak, Harbor                                        |
 | Guacamole                         | Depends on Keycloak, Harbor                                        | [guacamole directory](/guacamole/)
 | Dataset-service                   | Depends on Keycloak, Harbor, (Tracer), (Kubeapps), (Guacamole)     | [dataset-service directory](/dataset-service/)
 | QP-Insights                       | Depends on Keycloak, Harbor, (Dataset-service)                     | [qp-insights directory](/qp-insights/)
 | DSWS K8s Operator                 | Depends on Keycloak, Harbor, Dataset-service, Guacamole            | [dsws-operator](/dsws-operator/)
  | Jobman-service                    | Depends on Keycloak, Harbor, DSWS K8s Operator                     | [jobman-service](/jobman-service/)
 | Jobman-service                    | Depends on Keycloak, Harbor, Chaimeleon K8s Operator               |

Finally...
[extra-configurations](/extra-configurations/)
