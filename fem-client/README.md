# Setup

## Certificates

The certificates found in the secret "fem-client-secrets" are generateed by the admin of the FEM central services.
Each FEM client instance must be added to the central services and allowed to operate (no automatic way at the time of writing).

## Ceph connection

The deployment needs to mount the users' root folder in order to manage distributed jobs.
You have to create a ceph secret that allows k8s to mount the folders (please check out the secret example for Ceph in secrets.yml).

## Configmaps tokens and passwords

Some passwords (rabbitMQ) and tokens (Keycloak FEM client secret string) needed by the deployment are set in the configmaps, don't forget to adapt that to your cusom k8s deployment.

# Deployment

You can use the user friendly web interface of Kubeapps, or kubectl from the command line. 
Don't forget to create the namespace "eucaim-fed-computation"  beforehand (or, if different, adapt the k8s recipes).

# Upgrade
You can upgrade with the Kubeapps web interface or kubectl on the cmd line.

# Uninstall
Again you can uninstall with the Kubeapps web interface or kubectl on the cmd line by removing all the k8s objects.
