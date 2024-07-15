# Configuration of the helm charts:

Documentation of the Helm chart: 
https://github.com/goharbor/harbor-helm/tree/1.15.0  
https://artifacthub.io/packages/helm/harbor/harbor/1.15.0

## __values.yaml:__
Make a private copy of the values file and change it for your preferences.
```
cp values.yaml values.private.yaml
vim values.private.yaml
```
- `persistence.enabled`: _true_. Enable persistence.
- `persistence.persistentVolumeClaim.\*.existingClaim`: _harbor-harbor-pvc_. The name of the PVC defined in __pvc-harbor.yaml__.
- `harborAdminPassword`: _XXXXXXXXXX_. Just put one random and annotate to be able to access the first time before you enable the access with OIDC.
- `registry.credentials.password`: _XXXXXXXXXXX_. Just put one random.
- `database.internal.password`: _XXXXXXXXXX_. Just put one random.

# Deployment

First, you must create the namespace for the deployment of Harbor: `kubectl create namespace harbor`

Then, it is required to create the persistent volume claim (PVC) where all Harbor components will store their data.  
(This step only is required if persistence is enabled, which is our case.)
```console
kubectl -n harbor apply -f pvc-harbor.yaml
```

Now you can deploy Harbor:
```console
helm repo add harbor https://helm.goharbor.io
helm install harbor harbor/harbor --version 1.15.0 \
             --namespace harbor  -f values.private.yaml

# using oci still not works
#helm install harbor oci://helm.goharbor.io/harbor/harbor --version 1.15.0 \
              --namespace harbor -f values.private.yaml

# alternative: clone github repo
#git clone -b 1.6.0 https://github.com/chaimeleon-eu/helm-chart-harbor.git
#helm install harbor --namespace harbor  -f values.private.yaml ./helm-chart-harbor
```

As soon as all components are running, Harbor portal should be available at https://harbor.eucaim-node.i3m.upv.es/.
You should be able to login with user "admin" and the password previously set in "values" file (in `harborAdminPassword`).

NOTE: If trivy don't run and there is an error in log related to permissions just do that to adjust permissions in `trivy` of the pv:  
`chown 10000 /mnt/cephfs/k8s/volumes/csi/csi-vol-def94828-6eda-4db3-aa06-309dd23ff681/2a78f1f0-1264-4d25-b01c-9ddd5da1a1f0/trivy`
Also if you can't push images there is an error in log of registry related to permissions just change also the owner of `registry` dir:
`chown 10000 /mnt/cephfs/k8s/volumes/csi/csi-vol-def94828-6eda-4db3-aa06-309dd23ff681/2a78f1f0-1264-4d25-b01c-9ddd5da1a1f0/registry`

# Upgrade
Update the repo to get the last version:
```console
helm repo update harbor
helm repo list
```
If you want to upgrade to the version of the chart or apply any change in the values file:
```console
helm upgrade harbor harbor/harbor --version 1.15.0 \
             --namespace harbor  -f values.private.yaml
```

# Configure the access with OIDC
First you have to create a client for Harbor in Keycloak:
 - Type: `OIDC`
 - Client ID: `harbor`
 - Client authentication: `true`
 - Authentication flow: `Standard flow`
 - Valid Redirect URIs: `https://harbor.eucaim-node.i3m.upv.es/*`
 
After save, go to "Credentials" tab and annotate the secret for the Harbor configuration.
Also go to "Client scopes" tab and add scope `groups` as Default. 
In the same tab, go to the dedicated scope, change to "Scope" tab and disable "full scope allowed".

Now in Harbor Web UI go to "Administration" -> "Configuration" -> "Authentication" tab:
    Auth Mode: `OIDC`
    Primary Auth Mode: false
    OIDC Provider Name: `keycloak`
    OIDC Endpoint: `https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE`
    OIDC Client ID: `harbor`
    OIDC Client Secret: XXXXXX  (the secret annotated previously)
    OIDC Group Filter: (empty)
    Group Claim Name: `groups`
    OIDC Admin Group: `cloud-services-and-security-management`
    OIDC Scope: `openid,offline_access,groups,email,profile`
    Verify Certificate: true
    Automatic onboarding: true
    Username Claim: `preferred_username`

Note: the scope `offline_access` is required to access via CLI, otherwise an unauthorized error will be shown.
      On the other hand the scopes `groups`, `email` and `profile` are not strictly required in our case 
      because they are configured as `Default` in the client we configured in Keycloak.

# Other configurations
You should go to Harbor Web UI go to "Configuration" -> "System Settings" tab and set "Project Creation" to "Admin Only".

## Dockerhub proxy cache
Let's create a proxy-cache to docker-hub that will be used to pull the images of applications and services in the platform 
to avoid reaching the limit of downloads from DockerHub.

Go to "Administration" -> "Registries", you should create a "New endpoint" like this:
    Provider: Docker Hub
    Name: dockerhub
    Description: 
    Endpoint URL: https://hub.docker.com
    Access ID:
    Access Secret:
    Verify Remote Cert: true
    
Now go to Projects and create a new one with:
    Project Name: dockerhub
    Access Level: not public
    Project quota limits: -1
    Proxy Cache: true, and select the previously created endpoint

As the project is not public we are going to create a robot account for Kubernetes to access...

# Internal gateway
Now you can create it, the details are in the [internal-gateway directory](/internal-gateway/)

# Renew internal TLS certificates
If the internal TLS communication between Harbor's components (harbor-core, harbor-portal, registry, etc.) is enabled (`internalTLS.enabled: true` in Values), 
then a certificate is generated for each internal service and signed with an autogenerated CA.  
For instance you can see the certificate generated for harbor-core component with:
```console
kubectl get secret  harbor-core-internal-tls -n harbor -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -dates -noout -issuer
```
And you will see that it expires in a year.  
All those internal certificates are regenerated automatically when you do a `helm upgrade`.  
So remember to do an upgrade at least once a year.
