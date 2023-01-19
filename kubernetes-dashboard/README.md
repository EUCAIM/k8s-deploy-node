
Currently kubeapps can not be configured to use ingress with external oauth-proxy (with the "auth-url" annotation), 
but indeed the kubeapps oauth-proxy can be used as an auth-url by this ingress for kubernetes-dashboard.

An alternative is to deploy a dedicated oauth-proxy that can be shared by apps related to kubernetes like kubernetes-dashboard, kubeapps (hopefully in the future), hubble.

# Security notes
Anyway, it is important that this oauth-proxy is separated from the [general oauth2p](https://github.com/chaimeleon-eu/k8s-deployments/tree/master/oauth2p) for two reasons: 
 - Use different OIDC client (`clientID` option), in this case named "kubernetes",
   because the capabilities of a token issued for "kubernetes" client are greater than those of a token issued for "oauth2p" client.
 - Limit the cookie scope to the path with the option `cookie_path` to avoid its visibility to other apps in other paths 
   (that can be deployed by users and developed by 3rd parties).
