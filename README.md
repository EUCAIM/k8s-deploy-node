# Services running in CHAIMELEON:
- Kubernetes Dashboard: deployed using the Kubernetes Ansible role. URL: https://chaimeleon-eu.i3m.upv.es/dashboard/
- Guacamole: deployed using the helm chart. URL: https://chaimeleon-eu.i3m.upv.es/guacamole/
- Harbor: deployed using the helm chart. URL: https://chaimeleon-eu.i3m.upv.es:10443/
- Keycloak: deployed using plain YAMLs. URL: https://chaimeleon-eu.i3m.upv.es/auth/
- Kubeapps: deployed using plain YAMLs. URL: https://chaimeleon-eu.i3m.upv.es/apps/
- QuibimPrecision: deployed using the [helm chart](https://gitlab.com/primageproject/k8s_quibimprecision). URL: https://chaimeleon-eu.i3m.upv.es/omni/
    - PACS: deployed using [plain YAMLs](https://gitlab.com/primageproject/k8s_quibimprecision/-/tree/master/without_chart/pacs). URL: https://chaimeleon-eu.i3m.upv.es/dcm4chee-arc/ui2/
- Dataset-service: deployed using [plain YAMLs](https://github.com/chaimeleon-eu/dataset-service#deploy-with-kubernetes). URL: https://chaimeleon-eu.i3m.upv.es/dataset-service/
