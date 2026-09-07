# Enable Kubernetes plugin for OIDC authentication:
Kubeapps is a dashboard to deploy charts with Helm over Kubernetes, so if you want to use OIDC authentication in Kubeapps you need first enable the Kubernetes plugin for that.

Doc: 
 - OIDC in Kubeapps: https://github.com/kubeapps/kubeapps/blob/master/docs/user/using-an-OIDC-provider.md
 - OIDC in Kubernetes: https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens

Basically first you must create a client in Keycloak for kubernetes:
 - Type: `OIDC`
 - Client ID: `kubernetes`
 - Client authentication: `true`
 - Authentication flow: `Standard flow`
 - Valid Redirect URIs: `https://eucaim-node.i3m.upv.es/*`
 
After save, go to "Credentials" tab and annotate the secret for Kubeapps configuration.
Also go to "Client scopes" tab and add scope `groups` as Default. 
In the same tab, go to the dedicated scope, change to "Scope" tab and disable "full scope allowed".

Then you must edit ``/etc/kubernetes/manifests/kube-apiserver.yaml`` to add the following parameters to the command (kube-apiserver) of the container:
```
   - --oidc-issuer-url=https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE
   - --oidc-client-id=kubernetes
   - --oidc-username-claim=preferred_username
   - '--oidc-username-prefix=oidc:'
   - --oidc-groups-claim=groups
   - '--oidc-groups-prefix=oidc:'
```
On saving, the kube-apiserver pod (in "kube-system" namespace) should be automatically relaunched with the new configuration, 
but to ensure the changes, better restart kubelet service:
```console 
service kubelet restart
```
After that, the params should appear in the current pod manifest:
```console 
bash# kubectl -n kube-system get pod -l component=kube-apiserver -o yaml | grep oidc
   - --oidc-issuer-url=https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE
   - --oidc-client-id=kubernetes
   - --oidc-username-claim=preferred_username
   - '--oidc-username-prefix=oidc:'
   - --oidc-groups-claim=groups
   - '--oidc-groups-prefix=oidc:'
```

# Configuration of the helm chart
Doc: https://github.com/kubeapps/kubeapps/tree/master/chart/kubeapps#parameters

## __values.yaml:__
Make a private copy of the values file and change it according to your preferences.
```
cp values.yaml values.private.yaml
vim values.private.yaml
```

- `postgresql.auth.password`: _XXXXXXXXXXXXX_. You can put one random.

- `ingress`: Check the domain name appearing in some of the properties.
- `ingess.path`: the path to access to that service in the host.

- `authProxy.oauthLoginURI`: _"/apps/oauth2/start?rd=%2Fapps%2F"_. Check the path, appearing here two times: in the URI and in the redirection (rd).
- The same for the next line (`oauthLogoutURI`).
- `skipKubeappsLoginPage`: usually you may want to set to `true`; just remember set to `false` if you need to debug some problem with OIDC authentication, 
                           otherwise the browser can enter in a loop (login -> failed token validation -> login).
- `authProxy.clientID`: _kubernetes_. The clientID generated previously in Keycloak.
- `authProxy.clientSecret`: _XXXXXXXXXXXXXXXXXXXXX_. The client secret generated previously in Keycloak.
- `authProxy.cookieSecret`: _XXXXXXXXXXXXXXXXXX_. You can generate a random secret with: `python3 -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(16)))'`
- `authProxy.extraFlags`: 
    - `--oidc-issuer-url=https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE`. Base url of the realm.
    - `--proxy-prefix=/apps/oauth2`. Check the path.
    - `--cookie-path=/apps/`. Check the path.
    - `--whitelist-domain=eucaim-node.i3m.upv.es`. Check the domain name.
    - `--skip-auth-regex=^\\/apps\\/config\\.json$`. Check the path for all the files to skip. 
      Sometimes, if a specific file is not skipped, the browser can enter in a loop requesting authentication again and again.
      Take into account that the list of files to skip can change from one version to another, 
      so to make sure you include all the files required, see the chart template `frontend/deployment.yaml`. 

- `initialRepos`: You can add initial repositories which will be visible for all namespaces, like this from our Harbor service:
    ```
        - name: eucaim-node
          url: "https://harbor.eucaim-node.i3m.upv.es/chartrepo/charts"
    ```
    Note: on newer versions of Harbor the "chart museum" component has been removed and the charts have to be published with OCI.
          But Kubeapps currently is not able to retrieve charts from public OCI repository yet, at least not in easy way.
          So the solution now for us is to put our own chart repository (like chart museum) in the dataset-service output-files, 
          and the `initialRepos` should be like that: 
          ```
              - name: eucaim-node
                url: "http://eucaim-node.i3m.upv.es/dataset-service/output-files/"
          ```
    On the other hand, additional repositories can be added later once kubeapps is deployed and running, 
    see at the end of this document, where also there are more details of how to have your own chart repository.


# Deployment

First, you must create the namespace for the deployment of Kubeapps: `kubectl create namespace kubeapps`

In old versions of Kubernetes or in special configurations, some permissions error can appear when mounting or writing in the db persistence volume. 
In that case see volume/README.md.

Then review the configuration in the "values.yaml" file. Create your own, with your private passwords. Check the previous chapter.

Now, you can deploy the chart:
```console
helm install kubeapps oci://registry-1.docker.io/bitnamicharts/kubeapps --version 17.1.1 \
             --namespace kubeapps -f values.private.yaml
```

# Upgrade
If you want to upgrade the chart or apply any change in the values file:
```console
helm upgrade kubeapps oci://registry-1.docker.io/bitnamicharts/kubeapps --version 17.1.1 \
             --namespace kubeapps -f values.private.yaml
```

# Usage
As soon as all components are running, Kubeapps portal should be available at https://eucaim-node.i3m.upv.es/apps/.

# Authorization management
Doc: https://github.com/vmware-tanzu/kubeapps/blob/main/site/content/docs/latest/howto/access-control.md

Kubeapps is like a client of helm, on top of kubernetes, so the access is controled by the k8s resources `role`, `rolebinding`, `clusterrole`, `clusterrolebinding`.
The `roles`  and `clusterroles` define a set of allowed operations over resources in kubernetes. 
And with `rolebinding` and `clusterrolebinding` you can assign roles to OIDC users or groups.
The roles defined for the platform and the bindings to some OID groups are in the directory [/extra-configurations/role-bindings/](/extra-configurations/role-bindings/).
Now it's a good moment to go there and apply the manifests.

# Add the package repository as OCI (not fully supported, so it's difficult to get it working, not recommended)
Go to Kubeapps web portal and then to the menú "Administration" -> "Package repositories".
You should add one in "Global repositories" with:
  Name: `eucaim-node`
  URL: `oci://harbor.eucaim-node.i3m.upv.es/charts`
  Packaging format: Helm Charts
  Package Storage Type: OCI
  Authentication: 
    Repository Authorization: Basic Auth, with the username `robot$kubeappschartpuller` and the proper password
    Container registry credentials: None (Public)
  Filtering:
    List of Repositories: You should add here all the charts to retrieve (desktop-tensorflow, desktop-pytorch, jupyter-tensorflow, jupyter-pytorch)

Although you can set as public the project "charts" in harbor, currently the public access to OCI repo is not working in Kubeapps, 
so you have to create a robot in harbor to provide a username and password to configure here in Kubeapps. 
It is not needed to add any system nor project permissions to the robot, as the repo is public.  
Also you will have to update the list of repositories (filtering) whenever you add new charts in the repo. 
It is required for OCI repos because there is not any index defined in the standard.
Also you will have to configure the value pluginConfig.helm.packages.v1alpha1.globalPackagingNamespace: "zz-shared-apps",
and put the credentials of the robot in a secret in that namespace and give permissions to all the users to read that secret.
And finally you will have to upload the tgz files of charts to somewhere 
and put the link to it in the first entry of the "sources" section in the Chart.yaml for each chart,
and cross the fingers for everything goes well.

# Add the package repository as Helm Repository
NOTE: this is currently included in the `values.yaml` as an initial repo (apprepository.initialRepos)
to be automatically created when installing with helm, but the manual creation way is left below 
as an example to create other repos later.
Go to Kubeapps web portal and then to the menu "Administration" -> "Package repositories".
You should add one in "Global repositories" with:
  Name: `node-apps`
  URL: `http://eucaim-node.i3m.upv.es/dataset-service/output-files/charts/`
  Packaging format: Helm Charts
  Package Storage Type: Helm Repository
  Authentication: 
    Repository Authorization: None (Public)
    Container registry credentials: None (Public)

The url can be just some public directory in a web service with and index.yaml and the tgz files.  
The "index.yaml" file for the chart repository can easily generated with `helm repo index`, 
see [here](https://github.com/EUCAIM/upv-node-workstation-images/blob/9645478a40132d9eda55ba79a84d137ca94f4a45/helm-charts/package-and-upload.sh).

Or you can deploy a [chart museum](https://github.com/vmware-tanzu/kubeapps/blob/main/site/content/docs/latest/howto/private-app-repository.md#chartmuseum) instance.

