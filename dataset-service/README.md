# Deployment

## Configuration and preparations

You can make a private copy of the templates you want to adjust with your own passwords/secrets: 
```
cp 0-ceph-sercret.yaml 0-ceph-sercret.private.yaml
cp 1-db-service.yaml 1-db-service.private.yaml
cp 2-dataset-service.yaml 2-dataset-service.private.yaml
```

### Ceph account
We recommend to create a dedicated ceph account:
```
ceph --user imagingadmin fs authorize eucaimnodedata client.dataset-service /datalake rw /datasets rw
```
Take the key returned and replace the pattern `XXXXXXXX` in `0-ceph-sercret.private.yaml` with that key.

Also in `2-dataset-service.private.yaml` check the IP directions of `monitors` in the `volumes`.

### Database
Create a random password for the database and replace the pattern `XXXXXX` in `1-db-service.private.yaml` with it.
Also replace in `2-dataset-service.private.yaml` --> env `DATASET_SERVICE_CONFIG` --> `db` --> `password`.

### Authentication
You have to create two clients in Keycloak (frontend and backend).

Let's start with the backend, Dataset-service:
 - Type: `OIDC`
 - Client ID: `dataset-service`
 - Client authentication: `true`
 - Authentication flow: `Service account roles`
 - Root URL: `https://eucaim-node.i3m.upv.es/dataset-service/`
 - Home URL: `https://eucaim-node.i3m.upv.es/dataset-service/`
 
After save, go to "Credentials" tab take the secret and put it in  
`2-dataset-service.private.yaml` --> env `DATASET_SERVICE_CONFIG` --> `auth` --> `client` --> `client_secret`.
Now in the "Roles" tab create all the roles which are defined in the 
[default config file](https://github.com/chaimeleon-eu/dataset-service/blob/main/etc/dataset-service.default.yaml), 
in auth.token_validation.roles.

In the "Client scopes" tab, go to the dedicated scope, change to "Scope" tab and 
 - disable "full scope allowed"
 - and assign the roles: 
    - `tracer-webservice:trace_writer`
    - `realm-management:view-clients`
    - `realm-management:view-users`
    - `realm-management:query-users`
    - `realm-management:query-groups`
 
In the "Service account roles" tab add also the same previous roles.

Check all the URLs of the auth service in `2-dataset-service.private.yaml` --> env `DATASET_SERVICE_CONFIG` --> `auth`.

Go to url set in `token_issuer_public_keys_url` (in this case is https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/protocol/openid-connect/certs),
take the `kid` of the first key with `alg: RS256` and put it in 
`2-dataset-service.private.yaml` --> env `DATASET_SERVICE_CONFIG` --> `auth` --> `token_validation` --> `kid`.

Let's create now a client for the frontend, Dataset-explorer:
 - Type: `OIDC`
 - Client ID: `dataset-explorer`
 - Client authentication: `false`  (it's a public client)
 - Authentication flow: `Standard flow`
   (optionally you may want to add `Direct access grants` for example to allow developers to get tokens with curl to call directly to the backend API)
 - Root URL: `https://eucaim-node.i3m.upv.es/dataset-service`
 - Home URL: `/`
 - Valid redirect URIs: `/*`
 - Valid post logout redirect URIs: `+`
 - Web origins: `https://eucaim-node.i3m.upv.es`
 
After save, go to "Client scopes" tab and add scope `groups` as Default. 
In the same tab, go to the dedicated scope, change to "Scope" tab and
 - disable "full scope allowed"
 - and assign all the roles of the client 'dataset-service'.
Now change to "Mappers" tab, "Configure a new mapper", type "Audience":
 - Name: `aud dataset-service`
 - Included Client Audience: select `dataset-service`
 - Add to access token: true
That last configuration is required because keycloak does not include the `aud` claim if the user have not any client role assigned.

Finally the new roles created for the "dataset-service" client should be associated to the general realm roles.
In our case the relation is defined in the [Keycloak deployment readme](../keycloak/README.md#realm-roles).

### Tracer access
Set the URL of Tracer service in `2-dataset-service.private.yaml` --> env `DATASET_SERVICE_CONFIG` --> `tracer` --> `url`.
You can set it to empty to disable the notification to tracer.

### Zenodo access
Set the URL of Zenodo to deposite datasets when published in `2-dataset-service.private.yaml` --> env `DATASET_SERVICE_CONFIG` --> `zenodo`. 
Check the comments in this section in the [default config file](https://github.com/chaimeleon-eu/dataset-service/blob/main/etc/dataset-service.default.yaml).

### Secret tokens
Replace the pattern `XXXXXXXX` with random tokens in `2-dataset-service.private.yaml` --> env `DATASET_SERVICE_CONFIG` --> `self`.


## Deploy

Create a namespace: `kubectl create namespace dataset-service`  
Create the persistent volumes: `kubectl apply -n dataset-service -f 0-pvcs.yaml`  
Create the ceph secret: `kubectl apply -n dataset-service -f 0-ceph-secret.private.yaml`  
Create the service account, role and roleBinding: `kubectl apply -n dataset-service -f 0-service-account.yaml`  
Create the database deployment and service: `kubectl apply -n dataset-service -f 1-db-service.private.yaml`  
Create the main deployment and service: `kubectl apply -n dataset-service -f 2-dataset-service.private.yaml`  
Create the ingress: `kubectl apply -n dataset-service -f 3-ingress.yaml`
And finally the ingress: `kubectl apply -n dataset-service -f 4-ingress-for-redirect-from-root-path.yaml`

## Add scripts to be executed on user creation/deletion
See [here](user-management-jobs/README.md).

