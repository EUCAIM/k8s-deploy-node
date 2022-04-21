  
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
helm install --namespace keycloak -f values.private.yaml oauth2p oauth2-proxy/oauth2-proxy --version 6.2.0
```
We use the "keycloak" namespace because oauth2-proxy is a small service related with the main authentication service (keycloak), 
but it is not required to stay in the same namespace.

# Upgrade
If you want to upgrade the chart or apply any change in the config file:
```console
helm upgrade --namespace keycloak -f values.private.yaml oauth2p oauth2-proxy/oauth2-proxy --version 6.2.0
```

# Usage
As soon as the service is running, it should be available at https://chaimeleon-eu.i3m.upv.es/oauth2p/, 
with various [endpoints](https://oauth2-proxy.github.io/oauth2-proxy/docs/features/endpoints/).
Basically:
 - /oauth2p/auth: to check if the user is authenticated
 - /oauth2p/start: if the check fails, this is where you should redirect the user to start the authentication process

So, any web app deployed in the cluster can be "secured"
just adding a few lines in the _annotations_ section of the _ingress_ object of the web app:
```yaml
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://chaimeleon-eu.i3m.upv.es/oauth2p/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://chaimeleon-eu.i3m.upv.es/oauth2p/start"
    nginx.ingress.kubernetes.io/proxy-buffer-size: '16k'
...
```

This is a complete sample of ingress for _my-web-app_ provided by the _my-web-app-service_ at port 8888:

```yaml
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: my-web-app-ingress
  namespace: chaimeleon-user
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/backend-protocol: HTTP
    # next 3 lines ensure only platform authenticated users can access to the service
    nginx.ingress.kubernetes.io/auth-url: "https://chaimeleon-eu.i3m.upv.es/oauth2p/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://chaimeleon-eu.i3m.upv.es/oauth2p/start"
    nginx.ingress.kubernetes.io/proxy-buffer-size: '16k'
spec:
  tls:
    - hosts:
        - chaimeleon-eu.i3m.upv.es
  rules:
    - host: chaimeleon-eu.i3m.upv.es
      http:
        paths:
          - path: /chaimeleon-user/my-web-app/?(.*)
            pathType: Prefix
            backend:
              service:
                name: my-web-app-service
                port:
                  number: 8888

```

