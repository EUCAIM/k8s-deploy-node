# Configuration of the helm charts:

Documentation of the Helm chart: https://github.com/goharbor/harbor-helm
## __values-persistence.yaml:__

- Line 36: ``enabled``: _true_. Enable persistence.
- Lines 39,42,45,48,51,54: ``existingClaim``: _harbor-harbor-pvc_. The name of the PVC defined in __pvc-harbor.yaml__.
- Line 58: ``harborAdminPassword``: _XXXXXXXXXX_.
- Line 78: ``username``: _admin_. Name of the user for Photon container registry.
- Line 79: ``password``: _XXXXXXXXXX_. Name of the user for Photon container registry.
- Line 80: ``htpasswd``: _admin:XXXXXXXXXXX_. You can generate it using:
```console 
htpasswd -nbBC10 $username $password
```
- Line 96: ``password``: _XXXXXXXXXX_.
# Deployment

First, you must create the namespace for the deployment of Harbor:
```console
kubectl apply -f harbor-namespace.yaml
```
Then, it is required to create the persistent volume claim (PVC) where all Harbor components will store their data. This step only is required if persistence is enabled.
```console
kubectl apply -f pvc-harbor.yaml
```

Finally, you can deploy Harbor:
```console
git clone -b 1.6.0 https://github.com/goharbor/harbor-helm.git

helm install harbor --namespace harbor  -f values-persistence.yaml ./harbor-helm

```
As soon as all components are running, Harbor portal should be available at https://chaimeleon-eu.i3m.upv.es:10443/.

