# Services running in CHAIMELEON:

Authentication:
- Keycloak: deployed using plain YAMLs. URL: https://chaimeleon-eu.i3m.upv.es/auth/

Authorization:
- [Kube-authorizer](https://gitlab.com/primageproject/kube-authorizer): deployed using plain YAMLs.

Security Policy Management System:
- [Kyverno](https://kyverno.github.io/kyverno/): deployed using the Helm Chart. Pod Security Standard Policy: _baseline_. Other applied policies availables [here](https://github.com/chaimeleon-eu/k8s-deployments/tree/master/kyverno/policies).

Container image and Helm Chart repository:
- Harbor: deployed using the helm chart. URL: https://chaimeleon-eu.i3m.upv.es:10443/

Interact with Kubernetes:
- Kubernetes Dashboard: deployed using the Kubernetes Ansible role. URL: https://chaimeleon-eu.i3m.upv.es/dashboard/
- Kubeapps: deployed using plain YAMLs. URL: https://chaimeleon-eu.i3m.upv.es/apps/

Interact with deployed resources:
- Guacamole: deployed using the helm chart. URL: https://chaimeleon-eu.i3m.upv.es/guacamole/
- Kubernetes Dashboard: Only available for admins.


Ingestion services:
- QuibimPrecision: deployed using the [helm chart](https://gitlab.com/primageproject/k8s_quibimprecision). URL: https://chaimeleon-eu.i3m.upv.es/omni/
- PACS: deployed using [plain YAMLs](https://gitlab.com/primageproject/k8s_quibimprecision/-/tree/master/without_chart/pacs). URL: https://chaimeleon-eu.i3m.upv.es/dcm4chee-arc/ui2/

Chaimeleon core services:
- [Dataset-service](https://github.com/chaimeleon-eu/dataset-service#): deployed using [plain YAMLs](https://github.com/chaimeleon-eu/dataset-service#deploy-with-kubernetes). URL: https://chaimeleon-eu.i3m.upv.es/dataset-service/
- [Chaimeleon K8s Operator](https://github.com/chaimeleon-eu/k8s-chaimeleon-operator): deployed using the Helm Chart. 

