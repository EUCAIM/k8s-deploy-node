

You can find herein the instructions needed to deploy Jobman service and its Queue Position cron job on the EUCAIM-NODE cluster.

## Deployment

### Namespace

#### Web service (WS) and Queue Position Cron job (QP)

Jobman needs two namespaces. One for the service itself:

```kubectl create namespace jobman-service```

And another one for the job executions:

```kubectl create namespace jobman-service-exec```

If you **modify** the names of these namespaces, don't forget to modify the recipes used in the following steps too.

### Service accounts

#### Web service (WS)

Jobman needs the following service account to be able to execute jobs (role __role-jobman-serviceaccount__) and access configmaps (role __role-jobman-serviceaccount-configmap__):

```jobman-serviceaccount```

Apply the following recipe to create them (if you used different names for the namespaces, don't forget to change them in the **sc-roles-bindings-ws.yaml** file too):

```kubectl apply -f sc-roles-bindings-ws.yaml```

#### Queue Position Cron job (QP)

Apply the following recipe to create the service accounts, roles and role bindings (if you used different names for the namespaces, don't forget to change them in the **sc-roles-bindings-qp.yaml** file)

```kubectl apply -f sc-roles-bindings-qp.yaml```

### Configuration

#### Web service (WS)

The configuration of the web service is available in **config-ws.yaml**.
Make a copy of the file:

```cp config-ws.yaml config-ws.private.yaml```

and change the following:

- section __harborProjects__, if you have a repository protected by a token, please set the token, e.g. for the existing config in the repository named "library-batch-protected", set your token in the "token" field
- section __oidc.clientSecret__, set the secret of the jobman client from you OIDC system

Change other fields as needed and then deploy with:

```kubectl apply -f config-ws.private.yaml -n jobman-service```

#### Queue Position Cron job (QP)

The following two values are available:

- __EXEC_NAMESPACE__ is the namespace wher ethe Jobman jobs are launched (default __jobman-service-exec__)
- __QUEUE__ is the name of the configmap that holds the queue modified by the cron job

Deploy with:

```kubectl apply -f config-queue-position.yaml -n jobman-service```

### PVC

#### Web service (WS)

If you want to store the logs in a non-volatile place, you need a PVC deployed like:

```kubectl apply -f pvc.yaml -n jobman-service```

If you don't don't foget to adapt the deployment of the WS

### Service and deployment

#### Web service (WS)

Create a service and the deployment for the web service:

```kubectl apply -f service-deployment.yaml -n jobman-service```

### Cron Job

#### Queue Position Cron job (QP)

Deploy the cron job:

```kubectl apply -f cron-job.yaml -n jobman-service```

### Ingress

#### Web service (WS)

Make a copy of the ingress file:

```cp ingress.yaml ingress.private.yaml```

and set the host (__spec.rules.host__) according to your needs, in our case eucaim-node.i3m.upv.es

Create an ingress (default __<host>/jobman-service__) if you want the service to be accessible from the outside:

```kubectl apply -f ingress.yaml -n jobman-service```