# Build and upload image
```
cd chaimeleon_clinical_validation-2/ohif
docker build -t harbor.chaimeleon-eu.i3m.upv.es/in-silico-validation/chaimeleon-viewer:v3.8 .
docker push harbor.chaimeleon-eu.i3m.upv.es/in-silico-validation/chaimeleon-viewer:v3.8

cd chaimeleon_clinical_validation-2/chaimeleon-in-silico-app
docker build -t harbor.chaimeleon-eu.i3m.upv.es/in-silico-validation/chaimeleon-in-silico-app:v1.0 .
docker push harbor.chaimeleon-eu.i3m.upv.es/in-silico-validation/chaimeleon-in-silico-app:v1.0
```

# Configure
Make a copy of the values file and adjust to your own deployment:
`cp values.yaml values.private.yaml`

- Set the ingress params.
- Set OIDC params in `authProxy`.
- Set ceph user and password to access datasets in `persistence`.
- Set private registry credentials in `privateRegistryCredentials`.
- Set a random password for the DB in `orthancIndex.postgresqlPassword`.
- Set the dataset IDs used for the validation in `instances`.

# Install (deploy)
 - Create the namespace: `kubectl create namespace in-silico-validation`
 - Create the volume for data: `kubectl apply -n in-silico-validation -f pvc-data.yaml`
 - Create the volume for orthanc-index: `kubectl apply -n in-silico-validation -f pvc-orthanc-index.yaml`
 - Create directories in the data volume:
     ```
     mkdir -p pvc-data/orthanc-index
     mkdir -p pvc-data/chaimeleon-in-silico-app
     mkdir -p pvc-data/ohif
     ```
 
 - Download and unzip sources of the application: `unzip chaimeleon_clinical_validation-2.zip`
 - Copy the file 'init_script.sh' into the data volume:
     `cp chaimeleon_clinical_validation-2/init_script.sh pvc-data/orthanc-index/`
     
 - Copy the directory 'chaimeleon-in-silico-app/data' into the data volume:
     `cp -r chaimeleon_clinical_validation-2/chaimeleon-in-silico-app/data pvc-data/chaimeleon-in-silico-app/`

 - Copy the directory 'orthanc' into the data volume:
     `cp -r chaimeleon_clinical_validation-2/orthanc pvc-data/`
     
 - Copy the directory 'ohif/projects' and the file 'ohif/default.conf' into the data volume:
     `cp -r chaimeleon_clinical_validation-2/ohif/projects chaimeleon_clinical_validation-2/ohif/default.conf pvc-data/ohif/`
 
 - Deploy with helm: 
   ```
   helm repo add in-silico-validation https://harbor.chaimeleon-eu.i3m.upv.es/chartrepo/in-silico-validation \
                                      --username=robot\$insilicovalidationimagepuller --password=XXXXXXXXX
   helm repo update in-silico-validation
   helm install in-silico-validation  in-silico-validation/in-silico-validation --version 0.2.11 \
                --namespace in-silico-validation -f values.private.yaml
   ```

