# Configuration of the helm charts:

## __postgresql-values.yaml:__
Make a private copy of the values file and change it according to your preferences.
```
cp postgresql-values.yaml postgresql-values.private.yaml
vim postgresql-values.private.yaml
```

- `auth.postgresPassword`: _XXXXXXXXXX_. Put one random.
- `auth.username`: _grycap-admin_.
- `auth.password`: _XXXXXXXXXX_. Put one random.
- `auth.database`: _guacamole_. 

- `primary.persistence.enabled`: _true_. Enable persistence.
- `primary.persistence.existingClaim`: _guacamole-postgresql_. The name of the PVC defined in __postgresql-pvc.yaml__.

## __guacamole-values.yaml:__
Make a private copy of the values file and change it according to your preferences.
```
cp guacamole-values.yaml guacamole-values.private.yaml
vim guacamole-values.private.yaml
```
[ref](https://github.com/chaimeleon-eu/helm-chart-guacamole/blob/master/values.yaml)

- `dbcreation.adminUsername`: The name of an admin user account initially created for the first access. 
                              You can put "guacamole-admin" for example. You will have to create it in the auth service.
- `dbcreation.adminLocalPassword`: The password to access locally to the previous admin user. 
                                   We will not access locally, just put one randomly generated to avoid anyone else can access.

- `ingress.enabled`: _true_. If you want to create an ingress rule.
- `ingress.hosts`. The description of the ingress rules.
- `ingress.tls`. Define the information for https in the ingress rule.

- `postgres.hostname`: "10.108.142.178". Private IP of the container that is running the postgreSQL database.
- `postgres.database`: _guacamole_. The database name (previously defined in __postgresql-values.private.yaml__).
- `postgres.user`: _grycap-admin_. The name of the user in the database (previously defined in __postgresql-values.private.yaml__).
- `postgres.password`: _guacamole_. The password of the user in the database (previously defined in __postgresql-values.private.yaml__).

- `OIDC`: Adjust the parameters according to the client created in the auth service. See the next chapter.

# Configure the OIDC client
You have to create a client for Guacamole app in Keycloak (the auth service):
 - Type: `OIDC`
 - Client ID: `guacamole`
 - Client authentication: `false`  (it's a public client)
 - Authentication flow: `Standard flow`, `Implicit flow`
   (optionally you may want to add `Direct access grants` for example to allow developers to get tokens with curl to call directly to the backend API)
 - Root URL: `https://eucaim-node.i3m.upv.es/guacamole`
 - Home URL: `/`
 - Valid redirect URIs: `/*`
 - Valid post logout redirect URIs: `+`
 - Web origins: `https://eucaim-node.i3m.upv.es`
 - Admin URL: `https://eucaim-node.i3m.upv.es/guacamole`
 
After save, go to "Client scopes" tab and add scope `groups` as Default. 
In the same tab, go to the dedicated scope, change to "Scope" tab and disable "full scope allowed".

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
Then review the configuration in the "postgresql-values.yaml" file. Create your own, with your private passwords. Check the [previous chapter](#postgresql-values-yaml).

After this, you are able to deploy the database installing the helm chart ([ref](https://artifacthub.io/packages/helm/bitnami/postgresql)):
```console
# helm repo add bitnami https://charts.bitnami.com/bitnami
# helm install --namespace guacamole -f postgresql-values.private.yaml postgresql bitnami/postgresql --version 15.5.29
helm install postgresql oci://registry-1.docker.io/bitnamicharts/postgresql --version 15.5.29 \
             --namespace guacamole -f postgresql-values.private.yaml
```

## Main service
Finally, you can deploy Guacamole.  
Review the configuration in the "guacamole-values.yaml" file. Create your own, with your private passwords. Check the [previous chapter](#guacamole-values-yaml).  
Create the OIDC client, see the [previous chapter](#configure-the-oidc-client).  
Then just download the helm chart and install:
```console
git clone https://github.com/chaimeleon-eu/helm-chart-guacamole.git
helm install guacamole ./helm-chart-guacamole --namespace guacamole -f guacamole-values.private.yaml
```

As soon as Guacamole is running, it should be available at https://eucaim-node.i3m.upv.es/guacamole/.

Initially there is only one user created in the database with the name indicated in the property "dbcreation.adminUsername", we set to "guacamole-admin" by default. 
In order to enter with that user (with admin permissions) you must create a user in Keycloak with that same name.
Once you enter in the Guacamole configuration page with admin permissions you should create the admins group corresponding to the group defined in Keycloak (matching by name), 
in our case is "cloud-services-and-security-management".
Also you may want to create the user "platform-user-creator" (with permission "system admin") for the automatic creation of users and connection groups done by kube-authorizer.

