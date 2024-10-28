
## Build

Derived work based on the excellent docker Github repo at (https://github.com/LordGaav/docker-devpi)[https://github.com/LordGaav/docker-devpi].

All  the necessary files  are in the docker-devpi sub folder.
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
Be shure to adjust the __image__ entry in the __deployment.yml__.
It is points toward __harbor.chaimeleon-eu.i3m.upv.es/chaimeleon-services/__ by default, along with the updated Docker image name and tag.
You may have different values there.
Use the example YAMLs for a PVC, Service and Deployment. 
Be careful when changing the namespace where it is deployed, the address of the repository will change too.
Herein, the default namespace __package-repos-proxy__ is assumed.

### Python configuration

There are multiple ways to use our proxy, please see the next sub-chapters.

#### pip.conf

Use the example pip.conf in this folder. The default locations in linux are 

```
$HOME/.config/pip/pip.conf
/etc/pip.conf
```

#### pip runtime arguments

Pass __--index-url http://py-repo-service.package-repos-proxy:3141/root/pypi/+simple/__ and __--trusted-host py-repo-service.package-repos-proxy__ to pip e.g. `pip  install --index-url http://py-repo-service.package-repos-proxy:3141/root/pypi/+simple/ --trusted-host py-repo-service.package-repos-proxy datetime`

