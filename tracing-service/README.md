# Tracing service deployment

This repository contains the necessary configuration files and instructions to successfully deploy Tracing service on the EUCAIM NODE.

## Web service setup

Create a private copy of the __webservice/secrets.yml__ file:
```
   cp webservice/secrets.yml webservice/secrets.private.yml
```

Set the ImmuDB database password in the __webservice/secrets.private.yml__ file, property **settings_secret.yml**->**database_password**.
Deploy the config, secret, deployment, and service.
The deployment is configured to have 0 replicas.
If you haven't initialized the database yet, leave it like this until you finished the ImmuDB setup.
Otherwise you can scale it up to 1.

## ImmuDB setup

We use an updated Helm chart to deploy ImmuDB.
If you are using k8s-dashboard to deploy the chart, please follow the steps in the first sub-chapter to deploy a Helm helper.
Otherwise, if you have direct access to the k8s API, skip to the second sub-chapter, we assume that you can use Helm directly without a helper.

### K8s deployer job/deployment

The __k8s-deployer.yml__ file includes several resources needed to deploy a Helm chart via the k8s-dashboard.
Depending on your needs, you can use either the Job (that ends after a predefined time) or the deployment (that you have to sale down after finishing your work).
Both workloads offer access to Helm, kubectl, git, wget, curl etc. and mount a writable volume in __/data__ to allow you to operate.
To allow the correct function of the deployer, you need to deploy the PVC, the service account, the role, and the role binding.
Once deployed, you can exec into the job's/deployment's pod and prepare the Helm custom values.
To create the file, you can clone this repository while execed into the k8s deploye's pod and customise the file found at __tracing-service/db/custom-values.yaml__.
```
   git clone https://github.com/EUCAIM/k8s-deploy-node
```
You can now continue with the next sub-chapters of the ImmuDB setup.

### Prepare values

Make a copy of the file found at  __db/custom-values.yaml__:
```
   cp db/custom-values.yaml db/custom-values.private.yaml
```
One of the values you have to change is the admin password for the ImmuDB instance.
Generate a strong password and set the value of the **adminPassword** property.
You can also adjust the si\ze of the k8s volume via the **volume**->**size** property.
If needed, you can enable more services via the **service**->**ports** list property combined with the **env** property.

### Deployment

First, we need to clone the EUCAIM fork of ImmuDB containing the updated helm chart:
```
   git clone -b feat/helm-support-version-1.11 --single-branch https://github.com/EUCAIM/immudb
```

We can now install ImmuDB with Helm:
```
   helm install tracing-db immudb/helm --namespace tracing-service --values ./custom-values.private.yaml
```

## Init the database (if not done already)

In order to use the application, you have to initialize the database.
The job that does that is found in __init-job.yml__.
It doesn't need any adjustments, it will obtain the information from the already deployed components.

### Scale deployment

If the previous step of initializing ImmuDB has been completed successfully, you can scale up to one replica the webservice deployment.

## Network policies

The last step is to apply the network policies from __network_policies.yml__.
These are standard k8s policies, therefore should work with any compliant CNI.