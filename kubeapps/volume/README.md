Depending on the Kubernetes configuration you have, you may need to create the volume for persistence before the helm installation in order to adjust permissions. 
So you should create a volume (Persistent Volume Claim, PVC) for the database files with the name that the helm chart expects.
```console
kubectl apply -f postgresql-pvc.yaml
```

And then run a pod to set permissions in the volume for the user 1001 
(because in kubeapps-postgresql statefulSet there is a "spec.template.spec.containers[0].securityContext.runAsUser: 1001"):
```console
kubectl apply -f prepare-postgresql-pvc.yaml
```
