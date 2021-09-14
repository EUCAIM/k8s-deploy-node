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

First, you must create the namespace for the deployment of Guacamole and the database PostgreSQL:
```console
kubectl apply -f guacamole-namespace.yaml
```
Then, you must set up the database. First, it is required to create de persistent volume claim (PVC). After this, you are able to deploy the database installing the helm chart:
```console
kubectl apply -f postgresql-pvc.yaml

helm repo add bitnami https://charts.bitnami.com/bitnami

helm install --name postgresql --namespace guacamole  -f postgresql-values.yaml  bitnami/postgresql
```
Once the database is running, you must put its IP in the appropriate variable in the __guacamole-values.yaml__. Finally, you can deploy Guacamole:
```console
helm install --name guacamole --namespace guacamole  -f guacamole-values.yaml halkeye/guacamole
```
As soon as Guacamole is running, it should be available at https://chaimeleon-eu.i3m.upv.es/guacamole/#/.