
## Prerequisites

### Ceph user account

Jobman-service will launch jobs on behalf of users, and that job must be able to access the user home, the datalake, datasets and shared-folder.  
Thus, a ceph user for jobman must be created.
```
ceph --user imagingadmin fs authorize data client.jobman-service-exec /datasets r /datasets-test r \
                                                                      /datalake r /datalake-test r \
                                                                      /homes/users rw /homes/shared-folder rw
```
Security notes:  
  - That user can access to all the user homes, but only a specific home is mounted by the dsws-operator in the pod where the user algorithm runs.
  - That user also can access to all datalake and datasets, but the access in this case is controled by the permissions in the file system with the GID of the user,
    which is set in the context environment of the pod by the dsws-operator. The same applies to the shared-folder.

Then you shoud make a private copy of the secret and set the key obtained before:  
```
cp ceph-secret.yaml ceph-secret.private.yaml
vim ceph-secret.private.yaml
```
And apply:
```
kubectl apply -f ceph-secret.private.yaml
```

### Registry credentials secret for protected apps

There is a private project in the Harbor registry which contains the protected applications. 
So you must create the secret with the credentials to access, it will be used by k8s to pull the images for the jobs.  
You should make your private copy of the script, put your password and execute the script:
```
cp protected-regcred.sh protected-regcred.private.sh
vim protected-regcred.private.sh
sh protected-regcred.private.sh
```
Note a "robot" user is used to access Harbor that must be created there to obtain the password.

### Auth client

The Jobman-service accepts two types of authentication:
 - An API-Token: created for each user an left in the user namespace to be used by desktops (i.e. by jobman-cli command within desktops).
 - A JWT-Token: issued by Keycloak and used by other applications in the platform who want launch jobs for the user (e.g the FEM Client).

In order to validate both of them you have to create a client in Keycloak:
 - Type: `OIDC`
 - Client ID: `jobman-service`
 - Client authentication: `true`
 - Authentication flow: `Service account roles`
 - Root URL: `https://eucaim-node.i3m.upv.es/jobman-service/`
 - Home URL: `https://eucaim-node.i3m.upv.es/jobman-service/`
 
In the "Roles" tab, create the role "manage-own-jobs".
In the "Client scopes" tab, go to the dedicated scope, change to "Scope" tab and 
 - disable "full scope allowed"
 - and assign the roles: 
    - `realm-management:view-users`
    - `realm-management:query-users`
 
In the "Service account roles" tab add also the same previous roles.

Finally, go to the "Realm roles" general section and add the role `jobman-service:manage-own-jobs` to the role "data-scientists".

#### (Optional) Test client

Only for testing/developing purposes you can create another client (to generate tokens to access the Jobman-service):
 - Type: `OIDC`
 - Client ID: `jobman-client-test`
 - Client authentication: `false`  (it's a public client)
 - Authentication flow: `Standard flow` and `Direct access grants` (to allow developers to get tokens with curl to call directly to the backend API)
 - Root URL: ``
 - Home URL: ``
 - Valid redirect URIs: ``
 - Valid post logout redirect URIs: ``
 - Web origins: `https://eucaim-node.i3m.upv.es`

In the "Client scopes" tab, go to the dedicated scope, change to "Scope" tab and
 - disable "full scope allowed"
 - assign the role `jobman-service:manage-own-jobs`
Now change to "Mappers" tab, "Configure a new mapper", type "Audience":
 - Name: `aud jobman-service`
 - Included Client Audience: select `jobman-service`
 - Add to access token: true
That last configuration is required because keycloak does not include the `aud` claim if the user have not any client role assigned.


## Deployment

You can find herein the instructions needed to deploy Jobman service and its Queue Position cron job on the EUCAIM-NODE cluster.

### Namespace

#### Web service (WS) and Queue Position Cron job (QP)

Jobman needs two namespaces. One for the service itself:
```
kubectl create namespace jobman-service
```

And another one for the job executions:
```
kubectl create namespace jobman-service-exec
```

If you **modify** the names of these namespaces, don't forget to modify the recipes used in the following steps too.

### Service accounts

#### Web service (WS)

Jobman needs the the service account named `jobman-serviceaccount` to be able to 
 - execute jobs (role named `role-jobman-serviceaccount`)
 - and access configmaps (role named `role-jobman-serviceaccount-configmap`).

The service account, roles and role bindings are defined in the **sc-roles-bindings-ws.yaml** file (if you used different names for the namespaces, don't forget to change them in the the file too).  
Apply the recipe:
```
kubectl apply -f sc-roles-bindings-ws.yaml
```

#### Queue Position Cron job (QP)

Another service account is needed for the Queue Position Cron job to be able to 
 - see the jobs in the `jobman-service-exec` namespace
 - and write the results in the configmap of the `jobman-service` namespace.
 
Apply the recipe to create the service accounts, roles and role bindings (if you used different names for the namespaces, don't forget to change them in the **sc-roles-bindings-qp.yaml** file):
```
kubectl apply -f sc-roles-bindings-qp.yaml
```

### Configuration

#### Web service (WS)

The configuration of the web service is available in **config-ws.yaml**.  
Make a copy of the file:
```
cp config-ws.yaml config-ws.private.yaml
```

and change the following in your private copy:
 - section __harborProjects__, if you have a repository protected by a token, please set the token, e.g. for the existing config in the repository named "library-batch-protected", set your token in the "token" field
 - section __oidc.clientSecret__, set the secret of the jobman client from you OIDC system

Change other fields as needed and then deploy with:
```
kubectl apply -f config-ws.private.yaml
```

#### Queue Position Cron job (QP)

The following two values are available:
 - __EXEC_NAMESPACE__ is the namespace where the Jobman jobs are launched (default __jobman-service-exec__)
 - __QUEUE__ is the name of the configmap that holds the queue modified by the cron job

Deploy with:
```
kubectl apply -f config-qp.yaml
```


### Service and deployment

#### Web service (WS)

Create a service and the deployment for the web service:
```
kubectl apply -f service-deployment.yaml
```

### Cron Job

#### Queue Position Cron job (QP)

Create the cron job:
```
kubectl apply -f cron-job.yaml
```

### Network Policies

#### jobman-service (only for Cilium)

Apply the following network policies:
- jobman-queue-position
- jobman-service

Default deny everything ingress/egress disabled until the ingress rules in the __jobman-service__ policy can be applied.
```
kubectl apply -f network-policies-cilium.yaml
```

#### jobman-service-exec (jobs)

Apply the network policy __restrict-job-traffic__ for the jobs created in the `jobman-service-exec` namespace, to 
 - isolate jobs (pods) between them (deny all inbound traffic)
 - deny all traffic to outside and inside cluster except to some internal services (pip proxy, shared-sql-db, dns).

```
kubectl apply -f network-policy-restrict-job-traffic.yaml
```
Note it is the same network policy applied to user namespaces but adjusted for jobs in a shared namespace (uneeded ingress/egress exceptions are commented out). 
An alternative version for cilium is left in `network-policy-restrict-job-traffic-cilium.yaml` but is not intended to be applied.
