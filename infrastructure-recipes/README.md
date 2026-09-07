# Infrastructure deployment

## Configure ceph storage
The working nodes will mount the ceph volumes when start up, so first of all you must create the volumes.  
In order to create the volumes you will need a VM with connection to the ceph monitors, the ceph client installed 
and a ceph user with admin rigths.  

### Configure the ceph client
Configure the client creating the file: /etc/ceph/ceph.conf  
With the content:
```
[global]
        fsid = XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
        mon_host = [v2:192.168.2.21:3300/0,v1:192.168.2.21:6789/0] [v2:192.168.2.22:3300/0,v1:192.168.2.22:6789/0] [v2:192.168.2.23:3300/0,v1:192.168.2.23:6789/0]
[client.imagingadmin]
        key = XXXXXXX
```
You have to set your own fsid and IP addresses of monitors.  
And replace "imagingadmin" with your ceph username and "XXXXXXX" with the key.
Now `ceph` command should work.

### Create the cephfs volumes
Create cephfs volume for k8s PVs: 
`ceph --user imagingadmin fs volume create eucaimnodek8s`  
Two pools are created in ceph for each fs volum (one for meta and one for data).
You can see with `ceph --user imagingadmin fs volume ls`

You can easily see the contents of fs if you mount it.
```
echo "XXXXX" > /root/.cephx
mkdir -p /mnt/cephfs/k8s
mount -t ceph imagingadmin@.eucaimnodek8s=/ /mnt/cephfs/k8s -o mon_addr=192.168.2.21,secretfile=/root/.cephx
```
Where "XXXXX" is the key for the user imagingadmin.

Create cephfs volume for data (datalake, datasets, homes) and make as default fs:
```
ceph --user imagingadmin fs volume create eucaimnodedata
ceph --user imagingadmin fs set-default eucaimnodedata
```
Note it is important to set "eucaimnodedata" as the default fs to mount when it is not specified 
because the kubernetes option "cephfs" for volumes declaration in spec of pod/deployment/job does not allow specify the fs.
By the way that kubernetes option "cephfs" is deprecated from version 1.28 and removed from 1.31.

Mount and create the main directories:
```
mkdir -p /mnt/cephfs/data
mount -t ceph imagingadmin@.eucaimnodedata=/ /mnt/cephfs/data -o mon_addr=192.168.2.21,secretfile=/root/.cephx

mkdir /mnt/cephfs/data/datalake
mkdir /mnt/cephfs/data/datasets
mkdir /mnt/cephfs/data/homes
mkdir /mnt/cephfs/data/homes/shared-folder
mkdir /mnt/cephfs/data/homes/users
```


## Install ec3

```
pip install ec3-cli
```

## Requirements and configurations before deploy

First of all create your own copy of specific files which will contain your private passwords/tokens.
```console
cp auth.dat auth.private.dat
cp templates/eucaim-node-clues.radl      templates/eucaim-node-clues.private.radl
cp templates/eucaim-node-kubernetes.radl templates/eucaim-node-kubernetes.private.radl
```

Check out the file **auth.private.dat**: replace the pattern "XXXXXX" with your own secret values and change all you need for your case.  
If you use OpenStack cloud provider check the host and tenant.  
If you use other cloud provider or need help see the [doc](https://imdocs.readthedocs.io/en/latest/client.html#authorization-file).

Obtain a public IP and set in **eucaim-node-ubuntu.radl** -> `system front` -> `net_interface.0.ip`.  
Obtain a public domain name (for public access to the cluster services) pointing to the previous public IP  
and set in **eucaim-node-kubernetes.private.radl** -> `configure kubernetes_conf_front` -> `_public_domain_name`
and set in **eucaim-node-kubernetes.private.radl** -> `configure kubernetes_wn` -> `vars` -> `_public_domain_name`.

Set your username and your public SSH key in **eucaim-node-kubernetes.private.radl** -> `configure kubernetes_conf_front` -> `grycap_users`.

Generate a random token for Kubernetes with `tr -dc a-z0-9 </dev/urandom | head -c 51; echo`  
and put in **eucaim-node-kubernetes.private.radl** -> `configure kubernetes_conf_front` -> `_kubernetes_token`,
and in **eucaim-node-clues.private.radl** -> `configure clues2_front` -> `KUBERNETES_TOKEN`.

NOTE in **eucaim-node-kubernetes.radl** there is a variable `docker_containerd_root` in two configures with the value "/mnt/containerd". 
This is where the docker images and containers will be written, and the ephemeral disk usually is mounted in "/mnt".
You should ensure the ephemeral disk is formated in EXT4 and not in FAT32, 
otherwise you will see an error like "operation not permitted" when an image is pulled and symbolic links are created for the layers.

Set ceph access parameters for the WNs to mount the "eucaimnodedata" volume created previously  
in **eucaim-node-kubernetes.private.radl** -> `configure cephfs_mountings` -> `vars`.


## Deploy

Deploy the cluster using EC3:
```bash
HOME=$PWD \
ec3 -ll 2 -l logs/log.txt \
    launch -a auth.private.dat eucaim-node eucaim-node-ubuntu eucaim-node-im eucaim-node-clues.private \
                                           eucaim-node-kubernetes.private
```
You can see the log in other terminal with `tail -f log.txt`.
And you can see the result of tasks being executed with: `HOME=$PWD ec3 show -r eucaim-node`.
A directory `.ec3` will be created, it is the working directory of ec3 and contains an important subdirectory `clusters`
which is all you need if you want to get details later, or reconfigure or even destroy the cluster.

If the deployment fails or you want to adjust something, just edit the corresponding radl file in templates and do:
```bash
HOME=$PWD \
ec3 reconfigure -r eucaim-node
```

At the end you should be able to access via SSH to the front VM (with the SSH Key configured previously) and make some checks:
```bash
sudo su
# elasticity service
clues status
# kubernetes nodes
kubectl get nodes
# cilium nerwork
cilium status
# helm charts installed
helm list -A
```

### Power on nodes
Initialy two nodes are launched: the front and wn-1.  
To manage the nodes you can use "clues" command in the front VM.  
You can list all the available nodes with: `clues status`  
and start one with: `clues poweron wn2.localdomain`  
The previous command ends in a few seconds, but the deployment process is still running in the IM service,  
you can see the logs of IM service with executing that in the front: `tail -f /var/log/im/im.log`  
or check the state with ec3: `HOME=$PWD ec3 list`   (it can be "running", "configured" or "failed")  
and see the results of contextualization process with: `HOME=$PWD ec3 show -r eucaim-node > logs/poweron-wn-2.txt`  

Note: "ec3 list" does not update the state, instead you can check with: `grep state logs/poweron-wn-2.txt` 

Note you should: 
 - adjust the clues rules (cluster elasticity) 
 - or disable it with `update-rc.d cluesd disable` and stop it with `service cluesd stop`  
   and just run it when you need with `service cluesd restart`.

### IM commands (advanced)
EC3 is on top of IM, so you can go one level down using IM commands for troubleshoot or advanced operations.
If you want to use im client instead of ec3, you can install and configure with:
```
pip install IM-client

echo '
[im_client]
restapi_url=http://localhost:8800
auth_file=auth.private.dat
' > im_client.cfg
```
Note this is the config for accessing from within the front node where the IM service is running,
but if you want to use from your own computer just change the url, for example:
```
restapi_url=http://eucaim-node.i3m.upv.es:8800
```
Also note it is HTTP protocol (not secure) so you should only access from a trusted network 
or configure the TLS with a certificate in the IM service and change to `https://`.

## Some core services to deploy
Let's install some core services on top of Kubernetes in the proper order.

### ceph-csi
This is the ceph provisioner in Kubernetes.
Whenever a PVCs (Persistent Volume Claim) is created, the provisioner creates a PV (Persistent Volume)
corresponding to a subvolume in the cephfs volume created previously.

First you must create a subvolume group in the fs created before:  
```
ceph --user imagingadmin fs subvolumegroup create eucaimnodek8s csi
```
A directory "/volumes/csi/" is created in the fs.
Every k8s PVC created will trigger the creation of a subvolume in that subvolumegroup 
and the contents will be written in a subdirectory like "/volumes/csi/csi-vol-<uid>".

Let's configure now the values file for the helm chart:
```
cp k8s-core-services/ceph-csi-3.11.0-values.yaml k8s-core-services/ceph-csi-3.11.0-values.private.yaml
vim k8s-core-services/ceph-csi-3.11.0-values.private.yaml
```
You have to set:
 - the fsid in `csiConfig.[0].clusterID` and `storageClass.clusterID`
 - fs volume name ("eucaimnodek8s" previously created) in `storageClass.fsName`
 - monitor IPs in `csiConfig.[0].monitors`
 - user name in `secret.adminID`
 - user key in `secret.adminKey`

Finally install with:
```
helm repo add ceph-csi https://ceph.github.io/csi-charts
helm install ceph-csi-cephfs ceph-csi/ceph-csi-cephfs --version 3.11.0 \
             --namespace ceph-csi-cephfs --create-namespace \
             -f k8s-core-services/ceph-csi-3.11.0-values.private.yaml
```

### ingress-nginx
```
helm install ingress-nginx ingress-nginx --repo https://kubernetes.github.io/ingress-nginx --version 4.13.3 \
             --namespace ingress-nginx --create-namespace \
             -f k8s-core-services/ingress-nginx-4.13.3-values.yaml
```
Wait until ready:
```
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

### cert-manager
```
helm repo add jetstack https://charts.jetstack.io --force-update
helm install cert-manager jetstack/cert-manager --version v1.19.0 \
             --namespace cert-manager --create-namespace \
             -f k8s-core-services/cert-manager-1.19.0-values.yaml
```

#### Create the Let's encrypt certificate issuer
Set your email to be notified if anytime the automatic renewal of a certificate fails and it is close to expire.
```
sed 's/{{ ADMIN_EMAIL }}/youremail@email.com/g' k8s-core-services/cert-manager-letsencrypt-prod-cert-issuer.yaml \
                                              > k8s-core-services/cert-manager-letsencrypt-prod-cert-issuer.private.yaml
```
And apply:
```
kubectl -n cert-manager apply -f k8s-core-services/cert-manager-letsencrypt-prod-cert-issuer.private.yaml
```

### K8s dashboard
It requires the ingress-nginx and cert-manager.
Review the configuration values file `k8s-core-services/kubernetes-dashboard-7.5.0-values.yaml`.  
You should confirm
 - the public domain name in `app.ingress.hosts` and in `app.ingress.tls.secretName`
 - and the path where expose the dashboard in `app.ingress.path`.

And install:
```
helm repo add kubernetes-dashboard https://kubernetes-retired.github.io/dashboard/
helm install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --version 7.5.0 \
             --namespace kubernetes-dashboard --create-namespace \
             -f k8s-core-services/kubernetes-dashboard-7.5.0-values.yaml
```
It should automatically acquire the certificate for the public domain name.  
At the end you can access through the ingress proxy with:  
https://eucaim-node.i3m.upv.es/k8s-dashboard/

#### nodeport service (Optional)
Optionally you can add an extra nodeport service to be able to access directly in port 30443 and not through the ingress-nginx proxy 
(usefull to do adjustments or fix something when the proxy is not working or to avoid noise when you are monitoring the proxy logs):
```
kubectl -n kubernetes-dashboard apply -f k8s-core-services/kubernetes-dashboard-7.5.0-additional-service.yaml
```
So now you can access directly with:
https://eucaim-node.i3m.upv.es:30443

### K8s metrics-server (Optional)
It will be used (if available) by: 
 - the k8s-dashboard, if `metricsScraper` container is enabled (see values file, it is enabled by default), to show graphs of cpu and memory usage
 - jobman, to show cpu and memory usage in the jobs details.

Review the configuration values file `k8s-core-services/metrics-server-3.12.2-values.yaml`.  
And install:
```
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm install metrics-server metrics-server/metrics-server --version 3.12.2 --namespace kube-system \
             -f k8s-core-services/metrics-server-3.12.2-values.yaml
```
NOTE: The next version 3.13 requires k8s 1.31+, so is not compatible with our k8s current version 1.29.

# Upgrade services

## cilium
Whenever a new cilium patch is published we can upgrade our deployment.  
This is for patch upgrades (1.15.x -> 1.15.y).  
For minor version upgrade see documentation: https://docs.cilium.io/en/v1.15/operations/upgrade/

First time we installed cilium with ansible role, so we don't have the values file (temporary generated during the deployment).  
But we know it was installed with helm, we can see it:  
```
# helm -n kube-system list
NAME    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
cilium  kube-system     1               2024-07-09 08:41:27.487438011 +0000 UTC deployed        cilium-1.15.6   1.15.6
```
So we can get it with:
```
helm -n kube-system get values cilium  > cilium-values-1.15.6.yaml
# discard the first line
cat cilium-values-1.15.6.yaml | tail +2 > cilium-values-1.15.6.yaml.tmp
mv cilium-values-1.15.6.yaml.tmp cilium-values-1.15.6.yaml
```
Now you should go to the helm chart web page, download default values file of the current and the new version, and check differences:  
`diff cilium-default-values-1.15.6.yaml cilium-default-values-1.15.10.yaml`
And update the current values file according to the changes between versions.
```
cp cilium-values-1.15.6.yaml cilium-values-1.15.10.yaml
vim cilium-values-1.15.10.yaml
```
And finally upgrade with:
```
helm -n kube-system upgrade cilium cilium/cilium --version 1.15.10 -f cilium-values-1.15.10.yaml
```
