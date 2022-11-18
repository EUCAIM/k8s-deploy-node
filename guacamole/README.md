# Configuration of the helm charts:

## __postgresql-values.yaml:__
- Line 136: ``postgresqlPostgresPassword``: _XXXXXXXXXX_.
- Line 141: ``postgresqlUsername``: _grycap-admin_.
- Line 158: ``postgresqlDatabase``: _guacamole_. 
- Line 390: ``enabled``: _true_. Enable persistence.
- Line 395: ``existingClaim``: _guacamole-postgresql_. The name of the PVC defined in __postgresql-pvc.yaml__.
- Line 407: ``storageClass``: _"cephfs"_. The name of the Kubernetes storageclass of the PVC.

## __guacamole-values.yaml:__
- Line 52: ``ingress``
    - Line 53: ``enabled``: _true_. If you want to create an ingress rule.
    - Line 58: Array ``hosts``. The description of the ingress rules.
    - Line 63: ``tls``. Define the information for https in the ingress rule.
- Line 86: ``postgres``:
    - Line 87: ``hostname``: "10.108.142.178". Private IP of the container that is running the postgreSQL database.
    - Line 89: ``database``: _guacamole_. The database name (line 158 of __postgresql-values.yaml__).
    - Line 90: ``user``: _grycap-admin_. The name of the user in the database (line 141 of __postgresql-values.yaml__).
    - Line 91: ``password``: _guacamole_. The password of the user in the database (line 136 of __postgresql-values.yaml__).

# Deployment
First of all, you must create the namespace for the deployments of Guacamole and the database:
```console
kubectl create namespace guacamole
```

## Database
For the database it is required to create the persistent volume claim (PVC).  
This step only is required if persistence is enabled which is our case. 
```console
kubectl apply -f postgresql-pvc.yaml
```
Now make a private copy of the values file and change it for your preferences.
```console
cp postgresql-values.yaml postgresql-values.private.yaml
```
After this, you are able to deploy the database installing the helm chart ([ref](https://github.com/bitnami/charts/tree/master/bitnami/postgresql)):
```console
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install --namespace guacamole -f postgresql-values.private.yaml postgresql bitnami/postgresql --version 11.9.12
```
## The main service
Finally, you can deploy Guacamole.
Again make a private copy of the values file and change it for your preferences ([ref](https://github.com/chaimeleon-eu/helm-chart-guacamole/blob/master/values.yaml)):
```console
cp guacamole-values.yaml guacamole-values.private.yaml
```
Then just download the helm chart and install:
```console
git clone https://github.com/chaimeleon-eu/helm-chart-guacamole.git
helm install --namespace guacamole -f guacamole-values.private.yaml  guacamole ./helm-chart-guacamole
```

As soon as Guacamole is running, it should be available at https://chaimeleon-eu.i3m.upv.es/guacamole/.

Initially there is only one user created in the database with the name indicated in the property "dbcreation.adminUsername". In order to enter with that user (with admin permissions) we must create a user in Keycloak with that same name.
Once we accessed in the Guacamole configuration page with admin permissions we can create the admins group corresponding to the group defined in Keycloak (matching by name), in our case is "cloud-services-and-security-management".
Also you may want to create the user "chaimeleon-user-creator" (with permission "system admin") for the automatic creation of users and connection groups done by kube-authorizer.

