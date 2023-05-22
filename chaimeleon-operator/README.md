# Configuration of the helm chart:

## __installation-values.yml:__
Keycloak configuration parameters:
- Line 23: ``keycloakClient``: _"kubernetes-operator"_.
- Line 24: ``keycloakClientSecret``: _"XXXXXXXXXXXXXXXX"_.
- Line 25: ``keycloakEndpoint``: _"https://chaimeleon-eu.i3m.upv.es/"_. 
- Line 26: ``keycloakRealm``: _"CHAIMELEON"_. 

Dataset service configuration parameters:
- Line 27: ``datasetServiceEndpoint``: _"http://dataset-service-backend-service.dataset-service.svc.cluster.local:11000/"_. 

Variables to handle the difference between users/groups at Keycloak and Kubernetes:
- Line 28: ``k8sUserPrefix``: _"oidc:"_. 

# Deployment

First, you download the Helm Chart:
```console
git clone https://github.com/chaimeleon-eu/k8s-chaimeleon-operator.git
```
Then, you can deploy it using the __installation-values.yml:__ with the following command. The Chaimeleon operator will be available in the __chaimeleon-operator__ namespace:
```console
helm install chaimeleon-operator ./k8s-chaimeleon-operator/chaimeleon-operator-chart -f installation-values.yml --namespace chaimeleon-operator --create-namespace 
```

# Upgrade

```console
helm upgrade chaimeleon-operator ./k8s-chaimeleon-operator/chaimeleon-operator-chart -f installation-values.yml --namespace chaimeleon-operator
```


## Uninstall
```
sudo helm -n chaimeleon-operator delete chaimeleon-operator
```
Then delete the webhooks created by the operator.
```
sudo kubectl get -A validatingwebhookconfigurations
sudo kubectl delete mutatingwebhookconfigurations chaimeleon.eu 
sudo kubectl delete validatingwebhookconfigurations chaimeleon.eu 
sudo kubectl get -A validatingwebhookconfigurations
```
