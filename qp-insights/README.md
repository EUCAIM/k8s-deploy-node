# (Optional) Generate package from source
```
helm package chart
```
This command generates a tgz package which can be uploaded to any chart repository.

# Deployment

## Configuration and preparations
 - Create the namespace: `kubectl create namespace quibim`
 
 - Create the volume for database: `kubectl apply -n quibim -f pvc_database.yaml`
 - Create the main volume: `kubectl apply -n quibim -f pvc_qpi_data.yaml`
   
 - Make a copy of the default values file `chart/values.yaml` to adjust the values for your desired deployment:
   `cp chart/values.yaml values-eucaim-node.private.yaml`

 - Set ingress configuration in the `ingress` section of values file.
 - Set registry URLs in `dockerhubRegistry` and in `quibimRegistry`.
 - Set credentials for the quibim private registry in `privateRegistryCredentials`.

### Ceph account
It is recommended to create a dedicated ceph account:
```
ceph --user imagingadmin fs authorize eucaimnodedata client.qp-insights /datalake rw
```
Take the key returned and replace the pattern `XXXXXXXX` in values file in `persistence.datalakeCephAccess.password` with that key.  
Also check the IP directions in `persistence.datalakeCephAccess.monitors`.

### Mongo DB
Set a random MongoDB password in `mongodb.password` (in values file).

Download or clone from bitbucket.org:quibim/compose_qp_insights.git 
and copy the directory "scripts" into the main volume (it contains the dump with initial contents for DB, 
the dump will be loaded only when the database is empty).

Set `mongodb.db` (in values file) according to the database name in the dump file, usually `modb-qpinsights`.

### Authentication
There are several configurations to do in the auth service (Keycloak).
First you have to create two special client scopes:
 - api://qpinsights-backend/general
 - api://qpinsights-link/general
Just create each of them setting that name and uncheck the option "Display on consent screen". 
It is not required to create any mapper for them.

Then you have to create 4 clients: 
 - for the "discovery" application 
   - one for the frontend ("**qpinsights**") (that one will access to both backends)
   - one for the backend ("**qpinsights-backend**")
 - for the "viewer" application
   - one for the frontend ("**qpinsights-viewer**") 
   - and the last one for the backend ("**qpinsights-link**").

#### client `qpinsights-backend`
Let's start with the backend of discovery:
 - Type: `OIDC`
 - Client ID: `qpinsights-backend`
 - Client authentication: `true`
 - Authentication flow: `Standard flow`
 - Root URL: empty
 - Home URL: empty
 
After save, go to "Credentials" tab take the secret and put it the values file --> `back.oidcClientSecret`.

Now in the "Roles" tab create the roles: Admin, Auditor, Clinician, Coordinator, Researcher, Sponsor.
And assign those client roles to the general realm roles. 
In our case the relation is defined in the [Keycloak deployment readme](../keycloak/README.md#realm-roles).

In the "Client scopes" tab, 
 - add the client scope `api://qpinsights-backend/general` as Optional,
 - go to the dedicated scope, change to "Scope" tab and disable "full scope allowed".

Check all the URLs of the auth service in the values file, in section `auth`.

#### client `qpinsights`
Let's create now a client for the frontend, Dataset-explorer:
 - Type: `OIDC`
 - Client ID: `qpinsights`
 - Client authentication: `false`  (it's a public client)
 - Authentication flow: `Standard flow`
   (optionally you may want to add `Direct access grants` for example to allow developers to get tokens with curl to call directly to the backend API)
 - Root URL: `https://qpinsights.eucaim-node.i3m.upv.es`
 - Home URL: `/`
 - Valid redirect URIs: `/*`
 - Valid post logout redirect URIs: `+`
 - Web origins: `https://qpinsights.eucaim-node.i3m.upv.es`
 
After save, go to "Client scopes" tab, add scope `groups` as Default 
and `api://qpinsights-backend/general` and `api://qpinsights-link/general` as Optional.  
In the same tab, go to the dedicated scope, change to "Scope" tab and
 - disable "full scope allowed"
 - and assign all the roles of the client 'qpinsights-backend' and also the roles `dataset-service:access_all_datasets` and `dataset-service:admin_datasets`.
 
Now change to "Mappers" tab, "Configure a new mapper", type "Audience":
 - Name: `aud qpinsights-backend`
 - Included Client Audience: select `qpinsights-backend`
 - Add to access token: true
 
And configure other "Audience" mapper with:
 - Name: `aud dataset-service`
 - Included Client Audience: select `dataset-service`
 - Add to access token: true
NOTE: that two mappers are required because keycloak does not include the `aud` claim if the user have not any client role assigned.

Configure other mapper, type "User Attribute":
 - Name: `upn-from-qpi-id-attribute`
 - User Attribute: `qpi_id`
 - Token Claim Name: `upn`
 - Claim JSON Type: select `String`
 - and enable all checkboxes to add to tokens and userinfo
 
Configure other mapper, type "User Client Role":
 - Name: `client roles`
 - Client ID: select `qpinsights-backend`
 - Multivaluated: `true`
 - Token Claim Name: `roles`
 - Claim JSON Type: select `String`
 - Add to access token: true

#### client `qpinsights-link`
Let's create now client for the backend of the viewer:
 - Type: `OIDC`
 - Client ID: `qpinsights-link`
 - Client authentication: `true`
 - Authentication flow: `Standard flow`
 - Root URL: empty
 - Home URL: empty
 
After save, go to "Credentials" tab take the secret and put it in the values file --> `link.oidcClientSecret`.

In the "Client scopes" tab, 
 - add the client scope `api://qpinsights-link/general` as Optional,
 - go to the dedicated scope, change to "Scope" tab and disable "full scope allowed".

#### client `qpinsights-viewer`
Let's create now a client for the frontend, Dataset-explorer:
 - Type: `OIDC`
 - Client ID: `qpinsights-viewer`
 - Client authentication: `false`  (it's a public client)
 - Authentication flow: `Standard flow`
   (optionally you may want to add `Direct access grants` for example to allow developers to get tokens with curl to call directly to the backend API)
 - Root URL: `https://qpviewer.eucaim-node.i3m.upv.es`
 - Home URL: `/`
 - Valid redirect URIs: `/*`
 - Valid post logout redirect URIs: `+`
 - Web origins: `https://qpviewer.eucaim-node.i3m.upv.es`
 
After save, go to "Client scopes" tab, add scope `groups` as Default and `api://qpinsights-link/general` as Optional.  
In the same tab, go to the dedicated scope, change to "Scope" tab and disable "full scope allowed".


## Install
Deploy with helm: `helm install qp-insights --namespace quibim -f values-eucaim-node.private.yaml ./chart`

Configure the platform accessing the URL that appears in the output of installation.

### Configurations after installation
Go to menu "Administration" -> "Settings" and set the endpoint of Dataset-service.

## Upgrade
`helm upgrade qp-insights --namespace quibim -f values-eucaim-node.private.yaml ./chart`
