# Configurations in the recipes:

## __dep2_database.yaml:__
- Line 30: ``POSTGRES_PASSWORD``: _XXXXXXXXXX_. The password for the user in the database.

## __dep3_keycloak_v4.yaml:__
- Line 48: ``KEYCLOAK_ADMIN``: _admin_. The name of the admin user.
- Line 50: ``KEYCLOAK_ADMIN_PASSWORD``: _XXXXXXXXXXXX_. The password of the admin user.
- Line 60: ``KC_DB_PASSWORD``: _XXXXXXXXXX_. The password of the user in the database (same as line 30 of __dep2_database.yaml__).

## __dep4_ingress.yaml:__
- Line 15 and 18: ``host``: _chaimeleon-eu.i3m.upv.es_. The domain name of the host.
- Line 22: ``path``: _auth_. The path to access to that service in the host.


# Deployment

First, you must create the namespace for the deployment:
```console
kubectl apply -f dep0_namespace.yaml
```
Then, it is required to create the persistent volume claims (PVC). There will be one for the database and others for themes and customizations of the main service. 
```console
kubectl apply -f dep0_volumes.yaml
```
Only in old version of Kubernetes you must launch a pod to initialize the permissions of the volumes:
```console
kubectl apply -f dep1_init_volumes.yaml
```
Once created the volume for themes (named _themes-data_), you must copy the contents of _themes_ directory into it. 
```console
cp -r themes/* /mnt/cephfs/k8s/volumes/csi/csi-vol-caf97e48-538d-11ed-ba01-4ebcc3a99ce5/8413b25e-a897-4807-8405-c8b2a8d17518/
```
It contains a directory named _chaimeleon_. That directory will be mounted on _themes_ directory of the keycloak working directory in the main service container, by default: ``/opt/keycloak/themes``.
The result in the container should be like that:
```console
bash-4.4$ ls /opt/keycloak/themes/
chaimeleon/    README.txt
```

Also copy the [event listeners](https://github.com/orgs/chaimeleon-eu/repositories?q=event-listener) to the PVC  ``standalone-deployments``.  
Current download links (2022-09-07):
```
wget "https://github.com/chaimeleon-eu/event-listener-datasetservice/raw/master/target/event-listener-datasetservice-1.0.0.jar"
# wget "https://repo1.maven.org/maven2/org/keycloak/keycloak-admin-client/19.0.3/keycloak-admin-client-19.0.3.jar"
# wget "https://github.com/chaimeleon-eu/event-listener-kubeauthorizer/raw/master/target/event-listener-kubeauthorizer-1.1.0.jar"
```
This files will be mounted on _providers_ directory of the keycloak working directory in the main service container, by default: ``/opt/keycloak/providers``. The result in the container should be like that:
```console
bash-4.4$ ls /opt/keycloak/providers/
event-listener-datasetservice-1.0.0.jar
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
As soon as Keycloak is running, some web sites should be available...
 - Main access at https://chaimeleon-eu.i3m.upv.es/auth/
 - Keycloak Admin Console at https://chaimeleon-eu.i3m.upv.es/auth/admin
 
And when CHAIMELEON realm is created...
 - Keycloak User Account Console at https://chaimeleon-eu.i3m.upv.es/auth/realms/CHAIMELEON/account

## CHAIMELEON EGI Check-in

Client Management URL (Dev): https://aai-dev.egi.eu/federation/egi/home



Privacy Policy: 
Terms of Use: 