  
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
helm install --namespace keycloak -f values.private.yaml oauth2p oauth2-proxy/oauth2-proxy --version 6.4.0
```
We use the "keycloak" namespace because oauth2-proxy is a small service related with the main authentication service (keycloak), 
but it is not required to stay in the same namespace.

# Upgrade
If you want to upgrade the chart or apply any change in the config file:
```console
helm repo update oauth2-proxy
helm upgrade --namespace keycloak -f values.private.yaml oauth2p oauth2-proxy/oauth2-proxy --version 6.4.0
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

## Filtering access by groups, email address
If you want to filter the access to your web app to only users from specific groups, you can add them as a parameter in the url of the "auth" endpoint.

Example:
```yaml
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://chaimeleon-eu.i3m.upv.es/oauth2p/auth?allowed_groups=data-scientists,external-researcher"
    nginx.ingress.kubernetes.io/auth-signin: "https://chaimeleon-eu.i3m.upv.es/oauth2p/start"
    nginx.ingress.kubernetes.io/proxy-buffer-size: '16k'
...
```

There are similar parameters to filter by email address and email domain. See the doc:
https://oauth2-proxy.github.io/oauth2-proxy/docs/features/endpoints#auth

-- 
More details (how it interacts with the "--allowed-groups" general configuration option): 
   https://github.com/oauth2-proxy/oauth2-proxy/pull/849/files

## Using the OIDC ID token or Access token
If you want to know some details of the user in your app, in order to, for example, show the name, or show/hide some components depending on the belonging to some group or role, 
then you can add another annotation:
```yaml
kind: Ingress
metadata:
  annotations:
    ...
    nginx.ingress.kubernetes.io/auth-response-headers: authorization
```
The value for the annotation is a coma-separated list of headers that is received from the auth call and you want to be passed to the backend service.
The official documentation for this annotations: https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#external-authentication

Some of the headers that can be included are:
 - `X-Auth-Request-Preferred-Username`: the short name choosed by the user, that is unique and can be used as an identifier (example: `james`)
 - `X-Auth-Request-Email`: the email of the user (example: `james@email.com`)
 - `X-Auth-Request-Groups`: a coma-separated list of the groups that the user belongs to (example: `data-scientists,dataset-administrator`)
 - `Authorization`: the known standard header that contains, in that case, the OIDC ID token (example: `Bearer eyJhbG...lhqg`)
 - `X-Auth-Request-Access-Token`: the OIDC Access token (example :`eyJhb...I8239w`)

  For the admin:
  Note that the oauth2-proxy must be configured to include that headers in the response. 
  This is to enable the options `set_authorization_header = true` for `authorization`
  and `set_xauthrequest = true` for the rest (but also `pass_access_token = true` is needed for `X-Auth-Request-Access-Token`).


