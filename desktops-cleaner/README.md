# desktops-cleaner
Python script to:
 - Notify to users by email when inactivity detected in desktops.
 - Remove desktops after a grace period.

## Requirements before install

### Create a service account in Keycloak 
The script will access Keycloak (through the Admin API) to retrieve the email of users.

Therefore you need to create a client as a service account in Keycloak:
 - Client id: desktops-cleaner
 - Description: It is used only to access the admin API to get email address of users.
 - Client authentication: true
 - Authentication flow: service account roles

The following roles must be added to the service account roles in order to let it obtain the email of users: 
    "realm-management/query-users", "realm-management/view-users".
In the "Client scopes" tab, go to the dedicated scope, change to "Scope" tab and 
 - disable "full scope allowed"
 - and assign the same previous roles assigned to the service account.

Annotate the client secret to be added in your values.private.yaml (`config.authService.clientSecret`), we will see later. 

### Create an admin user in Guacamole
The script will access also to Guacamole to obtain the inactivity time of desktops (days from the last connection).

So you must create an admin user account in Guacamole with: 
 - Name: "desktops-cleaner"
 - Password: any random
 - Permissions: system admin

Annotate the password to be added in your values.private.yaml (`config.guacamoleService.adminPassword`), we will see later. 

## Install on k8s
First of all, you should create a namespace:
```console
kubectl create namespace desktops-cleaner
```
Then apply the PVC to create a volume for the logs and a small database (just a yaml file, to remember the notified desktops):
```
kubectl apply -f pvc.yaml -n desktops-cleaner
```

Create a private copy of the values file and change it according to your preferences:
```
cp values.yaml values.private.yaml
vim values.private.yaml
```
Remember to include the secrets annotated previously.

Finally you can deploy with:
```
helm repo add chaimeleon-services https://harbor.chaimeleon-eu.i3m.upv.es/chartrepo/chaimeleon-services
helm install --namespace desktops-cleaner desktops-cleaner chaimeleon-services/desktops-cleaner --version 1.0.9 -f values.private.yaml
```

Alternatively you can download the helm chart directly from source code repository (github) and install with:
```console
git clone https://github.com/chaimeleon-eu/desktops-cleaner.git
helm install --namespace desktops-cleaner desktops-cleaner ./desktops-cleaner/helm-chart -f values.private.yaml
```

## Upgrade

You can upgrade with the Kubeapps web interface or with the helm command:
```console
helm upgrade --namespace desktops-cleaner desktops-cleaner chaimeleon-services/desktops-cleaner --version 1.0.9 -f values.private.yaml
```

## Uninstall

Again you can uninstall with the Kubeapps web interface or with the helm command:
```
sudo helm --namespace desktops-cleaner delete desktops-cleaner
```

