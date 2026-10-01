

You can find herein the instructions needed to deploy Jobman service and its Queue Position cron job on the EUCAIM-NODE cluster.

## Deployment

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

### Network Policies (only for Cilium)

Apply the following network policies:

- jobman-queue-position
- jobman-service

Default deny everything ingress/egress disabled until the ingress rules in the __jobman-service__ policy can be applied.
```
kubectl apply -f network-policies-cilium.yaml
```
