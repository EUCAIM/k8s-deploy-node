# Services running in EUCAIM UPV reference node:

Authentication:
- Keycloak: deployed using plain YAMLs. URL: https://node-eucaim.i3m.upv.es/auth/

Authorization:
- [Kube-authorizer](https://gitlab.com/primageproject/kube-authorizer): deployed using plain YAMLs.

Security Policy Management System:
- [Kyverno](https://kyverno.github.io/kyverno/): deployed using the Helm Chart. Pod Security Standard Policy: _baseline_. Other applied policies availables [here](https://github.com/eucaim/k8s-deploy-node/tree/master/kyverno/policies).

Container image and Helm Chart repository:
- Harbor: deployed using the helm chart. URL: https://harbor.node-eucaim.i3m.upv.es/

Interact with Kubernetes:
- Kubernetes Dashboard: deployed using the Kubernetes Ansible role. URL: https://node-eucaim.i3m.upv.es/dashboard/
- Kubeapps: deployed using plain YAMLs. URL: https://node-eucaim.i3m.upv.es/apps/

Interact with deployed resources:
- Guacamole: deployed using the helm chart. URL: https://chaimeleon-eu.i3m.upv.es/guacamole/
- Kubernetes Dashboard: Only available for admins.


Ingestion services:
- QuibimPrecision: deployed using the [helm chart](https://gitlab.com/primageproject/k8s_quibimprecision). URL: https://chaimeleon-eu.i3m.upv.es/omni/
- PACS: deployed using [plain YAMLs](https://gitlab.com/primageproject/k8s_quibimprecision/-/tree/master/without_chart/pacs). URL: https://chaimeleon-eu.i3m.upv.es/dcm4chee-arc/ui2/

Dataset administration and Traceability System:
- [Dataset-service](https://github.com/chaimeleon-eu/dataset-service#): deployed using [plain YAMLs](https://github.com/chaimeleon-eu/dataset-service#deploy-with-kubernetes). URL: https://chaimeleon-eu.i3m.upv.es/dataset-service/
- [Chaimeleon K8s Operator](https://github.com/chaimeleon-eu/k8s-chaimeleon-operator): deployed using the Helm Chart. 
- [Tracer Service](https://github.com/chaimeleon-eu/tracer). 

Authentication proxy:
- OAuth2-proxy: deployed using the helm chart. URL: https://node-eucaim.i3m.upv.es/oauth2p/
