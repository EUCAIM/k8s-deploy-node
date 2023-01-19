
# Deployment
To deploy that service first you need to add the chart repository:
```console
helm repo add oauth2-proxy https://oauth2-proxy.github.io/manifests
```
Then review the configuration in the "values.yaml" file. Create your own, with your private passwords.
```console
cp values.yaml values.private.yaml
```
You must create a client in keycloak to fill the clientID and clientSecret parameters. 
Make sure to include "groups" in the default scope in order to do the authorization by groups.

Then install with the configuration defined in "values.private.yaml":
```console
helm install --namespace kubernetes-dashboard -f values.private.yaml kubernetes-oauth2p oauth2-proxy/oauth2-proxy --version 6.4.0
```

# Upgrade
If you want to upgrade the chart or apply any change in the config file:
```console
helm repo update oauth2-proxy
helm upgrade --namespace kubernetes-dashboard -f values.private.yaml kubernetes-oauth2p oauth2-proxy/oauth2-proxy --version 6.4.0
```

# Usage
The same as the [general oauth2p](https://github.com/chaimeleon-eu/k8s-deployments/tree/master/oauth2p#usage) but with the path `k8s-oauth2p` instead of `oauth2p`.
