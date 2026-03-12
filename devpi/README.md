
It is a python packages repository which automatically download missing packages from PyPI.org.
So in fact it is a mirror which acts as a local cache.
The final purpose is to allow the users install any python package with the command `pip` but without give them access to the Internet,
because some projects don't want to allow the users to extract (upload) data from the platform.

## Build

Derived work based on the excellent docker Github repo at https://github.com/LordGaav/docker-devpi

All the necessary files are in the docker-devpi sub folder.
Simply build it by calling the following command inside the aformentioned directory:

```
docker build --tag devpi:<TAG> -f ./Dockerfile ./
```

You can test run the server by running:

```
docker run -d -p 3141:3141 -v <host_folder_root_devpi_full_data>:/devpi --name devpi-server devpi:<TAG>
```
##  Deploy on Kube

Upload the Docker image to your favorite repo.  
Be sure to adjust the __image__ entry in the __deployment.yml__, you may have different values there.

Use the example YAMLs for a PVC, Service and Deployment. 
Be careful when changing the namespace where it is deployed, the address of the repository will change too.
Herein, the default namespace __package-repos-proxy__ is assumed.

When using kubectl, you can use the following commands:
```
kubectl create namespace package-repos-proxy
kubectl apply -f pvc.yml
kubectl apply -f deployment.yml
kubectl apply -f service.yml
```

### Python configuration

There are multiple ways to use our proxy, please see the next sub-chapters.

#### pip.conf

Use the example pip.conf in this folder. The default locations in linux are 

```
$HOME/.config/pip/pip.conf
/etc/pip.conf
```

#### pip runtime arguments

Pass `--index-url http://devpi-service.package-repos-proxy:3141/root/pypi/+simple/` and `--trusted-host devpi-service.package-repos-proxy` to pip.  
Example: 
```
pip  install --index-url http://devpi-service.package-repos-proxy:3141/root/pypi/+simple/ --trusted-host devpi-service.package-repos-proxy datetime
```

Note: the `trusted-host` option is required when HTTPS is not used.
