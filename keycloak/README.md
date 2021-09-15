# Configurations in the recipes:

## __dep2_database.yaml:__
- Line 30: ``POSTGRES_PASSWORD``: _XXXXXXXXXX_. The password for the user in the database.

## __dep3_keycloak.yaml:__
- Line 48: ``KEYCLOAK_USER``: _admin_. The name of the admin user.
- Line 50: ``KEYCLOAK_PASSWORD``: _XXXXXXXXXXXX_. The password of the admin user.
- Line 60: ``DB_PASSWORD``: _XXXXXXXXXX_. The password of the user in the database (same as line 30 of __dep2_database.yaml__).
## __dep4_ingress.yaml:__
- Line 15 and 18: ``host``: _chaimeleon-eu.i3m.upv.es_. The domain name of the host.
- Line 22: ``path``: _auth_. The path to access to that service in the host.


# Deployment

First, you must create the namespace for the deployment:
```console
kubectl apply -f dep0_namespace.yaml
```
Then, it is required to create the persistent volume claims (PVC). There will be one for the database and another for themes and customizations of the main service. 
```console
kubectl apply -f dep0_volumes.yaml
```
You must launch a pod to initialize the permissions and contents of the volumes:
```console
kubectl apply -f dep1_init_volumes.yaml
```
Once initialized the volume with the original files from the official image, you can copy the _chaimeleon_ theme into the volume for themes (named _themes-data_). That volume will be mounted on _themes_ directory of the keycloak working directory in the main service container, by default: ``/opt/jboss/keycloak/themes/``. The result is like that:
```console
bash-4.4$ ls /opt/jboss/keycloak/themes/
base/        chaimeleon/  keycloak/    keycloak.v2/ README.txt
```
Now, you are able to deploy the database:
```console
kubectl apply -f dep2_database.yaml
```
Once the database is running, you can deploy the main service:
```console
kubectl apply -f dep3_keycloak.yaml
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
 