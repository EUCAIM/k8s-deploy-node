# Configurations in the recipes:

## __dep2_database.yaml:__
```
cp dep2_database.yaml dep2_database.private.yaml
vim dep2_database.private.yaml
```
- Set the ``POSTGRES_PASSWORD``: _XXXXXXXXXX_. The password for the user in the database.

## __dep3_keycloak_v4.yaml:__
```
cp dep3_keycloak_v4.yaml dep3_keycloak_v4.private.yaml
vim dep3_keycloak_v4.private.yaml
```
- Set the ``KEYCLOAK_ADMIN``: _admin_. The name of the admin user.
- Set the ``KEYCLOAK_ADMIN_PASSWORD``: _XXXXXXXXXXXX_. The password of the admin user.
- Set the ``KC_DB_PASSWORD``: _XXXXXXXXXX_. The password of the user in the database (same as the one set in __dep2_database.private.yaml__).

## __dep4_ingress.yaml:__
- Set the ``host``: _eucaim-node.i3m.upv.es_. The domain name of the host.
- Set the ``path``: _auth_. The path to access to that service in the host.


# Deployment

First, you must create the namespace for the deployment with: `kubectl create namespace keycloak`

Then, it is required to create the persistent volume claims (PVC). 
There will be one for the database and others for themes and customizations of the main service. 
```console
kubectl apply -f dep0_volumes.yaml
```
Only in old version of Kubernetes you must launch a pod to initialize the permissions of the volumes:
```console
kubectl apply -f dep1_init_volumes.yaml
```

Once created the volume for themes (named _themes-data_), you must copy the contents of _themes_ directory into it. 
```console
cp -r themes/* /mnt/cephfs/k8s/volumes/csi/csi-vol-b4e7ede0-8f9b-4f53-b441-1db2823c748b/9c5a23bd-8fcc-485d-a42c-4624ce3d4a94/
```
It contains a directory named _eucaim-node_. 
That directory will be mounted on _themes_ directory of the keycloak working directory in the main service container, by default: ``/opt/keycloak/themes``.
The result in the container should be like that:
```console
bash-4.4$ ls /opt/keycloak/themes/
eucaim-node/    README.txt
```

Also copy the [event listeners](https://github.com/orgs/chaimeleon-eu/repositories?q=event-listener) to the PVC  ``standalone-deployments``.  
Current download links (2024-07-09):
```
wget "https://github.com/chaimeleon-eu/event-listener-datasetservice/raw/master/target/event-listener-datasetservice-1.0.0.jar"
wget "https://github.com/chaimeleon-eu/event-listener-emailsender/raw/main/target/email-sender-event-listener-1.0.0.jar"
# wget "https://repo1.maven.org/maven2/org/keycloak/keycloak-admin-client/19.0.3/keycloak-admin-client-19.0.3.jar"
# wget "https://github.com/chaimeleon-eu/event-listener-kubeauthorizer/raw/master/target/event-listener-kubeauthorizer-1.1.0.jar"
```
This files will be mounted on _providers_ directory of the keycloak working directory in the main service container, by default: ``/opt/keycloak/providers``. 
The result in the container should be like that:
```console
bash-4.4$ ls /opt/keycloak/providers/
event-listener-datasetservice-1.0.0.jar
email-sender-event-listener-1.0.0.jar
```
Now, you are able to deploy the database:
```console
kubectl apply -f dep2_database.private.yaml
```
Once the database is running, you can deploy the main service:
```console
kubectl apply -f dep3_keycloak_v4.private.yaml
```
And finally you can create an ingress to access the main service:
```console
kubectl apply -f dep4_ingress.yaml
```
As soon as Keycloak is running, the Keycloak Admin Console should be available at: https://eucaim-node.i3m.upv.es/auth
 
And when EUCAIM-NODE realm is created...
 - Keycloak User Account Console at https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/account
 - Discovery endpoint (useful to configure clients) at https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/.well-known/openid-configuration

# Other configurations
Create the realm `EUCAIM-NODE`...

Create the roles...

Create the groups for roles and for projects.

Go to Client scopes and create one with:
  Name: `groups`
  Type: `None`
  Display on consent screen: `false`
  Include in token scope: `true`
And in "Mappers" tab add one "by configuration", select "Group Membership" and:
  Name: `groups`
  Token Claim Name: `groups`
  Full group path: `false`
  Add to ID token: `true`
  Add to access token: `true`
  Add to lightweight access token: `false`
  Add to userinfo: `true`
  Add to token introspection: `true`


## CHAIMELEON EGI Check-in

Client Management URL (Dev): https://aai-dev.egi.eu/federation/egi/home



Privacy Policy: 
Terms of Use: 