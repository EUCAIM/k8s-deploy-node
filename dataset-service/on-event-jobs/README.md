
# Add scripts to be executed by Dataset-service on some events

Actually the Dataset-service will launch a k8s job which execute the scripts.

The "k8s-templates" directory contains the k8s templates used for that.  
You shoud make a private copy of them and customize for your needs:  
```
cd k8s-templates
cp user-management-job-template.yaml user-management-job-template.private.yaml
vim user-management-job-template.private.yaml
cp user-management-ceph-secret.yaml user-management-ceph-secret.private.yaml
vim user-management-ceph-secret.private.yaml
cp site-management-job-template.yaml site-management-job-template.private.yaml
vim site-management-job-template.private.yaml
cp subproject-management-job-template.yaml subproject-management-job-template.private.yaml
vim subproject-management-job-template.private.yaml
```

The job-template will be read and applied by Dataset-service but the ceph-secret must be applied by you:
```
kubectl apply -n dataset-service -f k8s-templates/user-management-ceph-secret.private.yaml
```

And the scripts to be executed are in "scripts" directory. You can change them according to your needs.

Once you have your own job templates and scripts then you must copy them to the `dataset-service-data` persistent volume 
already created for the Dataset-service.
This is an example for a "k8s" ceph volume mounted in "/mnt/cephfs/" containing that persistent volume:
```
mkdir /mnt/cephfs/k8s/volumes/csi/csi-vol-17672da2/b70adcce-1cf7/on-event-jobs
cp -r k8s-templates/*-job-template.private.yaml scripts /mnt/cephfs/k8s/volumes/csi/csi-vol-17672da2/b70adcce-1cf7/on-event-jobs/
```
Note: you should mantain that directory structure if you want the Dataset-service finds the job template, 
otherwise you should adjust the paths in the Datasets-service's configuration parameter `on_event_scripts`.

There are additional requirements in that scripts, which have been added to the files "requirements-apt.txt" and "requirements-pip.txt",
so the container image must be rebuilt...
Download the Dockerfile from the Dataset-service source code repository:
```
curl -LO https://github.com/chaimeleon-eu/dataset-service/raw/refs/heads/main/on-event-jobs/Dockerfile
```
And build your container image and upload to the platform repository:
(the files "requirements-apt.txt" and "requirements-pip.txt" will be taken for the building)
```
set IMAGE_NAME=harbor.eucaim-node.i3m.upv.es/core-services/dataset-service-on-event-jobs
set /p IMAGE_TAG=< Dockerfile_version
docker build -t %IMAGE_NAME%:%IMAGE_TAG% .
docker push %IMAGE_NAME%:%IMAGE_TAG%
```
Ensure the image to be used in the templates `k8s-templates/*-job-template.private.yaml` is that one just pushed.

