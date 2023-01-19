# Enable Kubernetes plugin for OIDC authentication:
Kubeapps is a dashboard to deploy charts with Helm over Kubernetes, so if you want to use OIDC authentication in Kubeapps you need first enable the Kubernetes plugin for that.

Doc: 
 - OIDC in Kubeapps: https://github.com/kubeapps/kubeapps/blob/master/docs/user/using-an-OIDC-provider.md
 - OIDC in Kubernetes: https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens

Basically you must edit ``/etc/kubernetes/manifests/kube-apiserver.yaml`` to add the following parameters to the command (kube-apiserver) of the container:
```
   - --oidc-issuer-url=https://chaimeleon-eu.i3m.upv.es/auth/realms/CHAIMELEON
   - --oidc-client-id=kubernetes
   - --oidc-username-claim=username
   - '--oidc-username-prefix=oidc:'
   - --oidc-groups-claim=groups
   - '--oidc-groups-prefix=oidc:'
```
On saving, a new pod for kube-apiserver should be automatically deployed with the new configuration, but to ensure the changes, better restart kubelet service:
```console 
service kubelet restart
```
After that, the params should appear in the current pod manifest:
```console 
bash# kubectl -n kube-system get pod -l component=kube-apiserver -o yaml | grep oidc
   - --oidc-issuer-url=https://chaimeleon-eu.i3m.upv.es/auth/realms/CHAIMELEON
   - --oidc-client-id=kubernetes
   - --oidc-username-claim=username
   - '--oidc-username-prefix=oidc:'
   - --oidc-groups-claim=groups
   - '--oidc-groups-prefix=oidc:'
```

# Create a client in Keycloak for kubernetes
The parameters for the client should be:
 - Client ID: ``kubernetes``
 - Protocol: ``openid-conect``
 - Access Type: ``confidential``  (after save, "Credentials" tab appears, go on and anotate the secret for kubeapps configuration)
 - Valid Redirect URIs: ``https://chaimeleon-eu.i3m.upv.es/*``


# Configuration of the helm chart
Doc: https://github.com/kubeapps/kubeapps/tree/master/chart/kubeapps#parameters

## __kubeapps-values.yaml:__

- Line 5 and 13: ``host``: _chaimeleon-eu.i3m.upv.es_. The domain name of the host.
- Line 6: ``path``: _apps_. The path to access to that service in the host.

- Line 28: ``postgresqlPassword``: _XXXXXXXXXXXXX_. The password of the database user.

- Line 57: ``oauthLoginURI``: _"/apps/oauth2/start?rd=%2Fapps%2F"_. The path in line 5 appears here two times: in the URI and in the redirection (rd).
- The same for the next line (58: ``oauthLogoutURI``).
- Line 63: ``clientID``: _kubernetes_. The clientID generated previously in Keycloak.
- Line 64: ``clientSecret``: _XXXXXXXXXXXXXXXXXXXXX_. The client secret generated previously in Keycloak.
- Line 66: ``cookieSecret``: _XXXXXXXXXXXXXXXXXX_. You can generate a random secret with: ```python -c 'import os,base64; print base64.urlsafe_b64encode(os.urandom(16))'```
- Line 67: ``extraFlags``: 
    - ``--oidc-issuer-url=https://chaimeleon-eu.i3m.upv.es/auth/realms/CHAIMELEON``. Base url of the CHAIMELEON realm.
    - ``--proxy-prefix=/apps/oauth2``. Use the same path that in line 5.

- Line 144: ``initialRepos``: You can add initial repositories which will be visible for all namespaces, like this from our Harbor service:
```
    - name: chaimeleon-library
      url: "https://harbor.chaimeleon-eu.i3m.upv.es/chartrepo/chaimeleon-library"
```


# Deployment

First, you must create the namespace for the deployment:
```console
kubectl apply -f kubeapps-namespace.yaml
```

In old versions of Kubernetes o in special configurations, some permission error can appear when mounting or writing in the db persistence volume. In that case see volume/README.md.

Then review the configuration in the "values.yaml" file. Create your own, with your private passwords.
```console
cp values.yaml values.private.yaml
```
Now, you can deploy the chart:
```console
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install --namespace kubeapps -f values.private.yaml kubeapps bitnami/kubeapps --version 10.3.5
```

# Upgrade
If you want to upgrade the chart or apply any change in the config file:
```console
helm upgrade --namespace kubeapps -f values.private.yaml kubeapps bitnami/kubeapps --version 10.3.5
```

# Usage
As soon as all components are running, Kubeapps portal should be available at https://chaimeleon-eu.i3m.upv.es/apps/.

# Authorization management

Doc: https://github.com/kubeapps/kubeapps/blob/master/docs/user/access-control.md
```console
kubectl apply -f rolebindings.yml
```

