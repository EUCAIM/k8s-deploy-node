
This is a solution to provide free access (without need of authentication) to some specific projects in the Harbor registry 
(to allow free download/use of the images) from inside the cluster network 
but however require authentication to the external access (usually to upload images).

# Harbor configuration

To achieve that we have to make sure the project in Harbor is private (uncheck the "public" option), 
then create a "robot account" and give it access to the project.
You can set that values...
    Name: common-user
    Description: Used by any common user via internal-gateway.
    Expiration: never
    Project permissions: for library and library-batch
      - List artifact, repository, tag
      - Pull repository
      - Read artifact, repository

# Deployment

Now we deploy a small nginx service which will be accessible only from inside the cluster 
and is just a proxy to the harbor service but it inserts the "Authorization" header in every message to the upstream 
granting that way the access to protected projects/repositories without the need to provide the credentials.

We will use the `harbor` namespace because this is a service directly related to our Harbor deployment.

First, make a copy of the configmap and edit to set the basic auth token.
```console
cp configmap.yaml configmap.private.yaml
vim configmap.private.yaml
```
You can generate the basic auth token with: 
   echo -n "<username>:<userCLIToken>" | base64
In our case, we use a "robot" account named "common-user":
   echo -n "robot\$common-user:<theCLITokenOfTheRobot>" | base64

Then, create the configMap in k8s:
```console
kubectl apply -n harbor -f configmap.private.yaml
```

And now you can create the nginx deployment and service:
```console
kubectl apply -n harbor -f dep_gateway.yaml
```

As soon as the pod is running, Harbor portal should be available within the cluster at 
https://<kubernetes-front-public-ip>:5000/.

Note the type of the service is `NodePort`, so we can use the public IP address 
but we will never open the port 5000 in the cluster firewall (provided by OpenStack in our case).

Note also that the liveness probe is important but will fail until the next steps are done. 
You can comment out it until the end of the installation (until all the step are done).

# Add domain resolution in k8s nodes

Finally we can add the public domain and the "harbor" subdomain to the hosts file of every k8s node (working nodes and front node):
``` 
    sudo sed -i 's/kubeserver\r/kubeserver eucaim-node.i3m.upv.es harbor.eucaim-node.i3m.upv.es\r/' /etc/hosts
```
In our case we add the previous line as an ansible task in the cluster recipes.

So now we can set the `image` property of the containers to deploy with the name instead of the public IP. 
For example:
```
    image: harbor.eucaim-node.i3m.upv.es:5000/library-batch/ubuntu-python
```

# Add domain resolution in pods

We can configure the CoreDNS with:
```
    kubectl edit configmap coredns -n kube-system
```
    
Add the `hosts` block with lines using the same format as in /etc/hosts file and followed by `fallthrough`:
```
    hosts {
       192.168.3.35   eucaim-node.i3m.upv.es harbor.eucaim-node.i3m.upv.es
       fallthrough
    }
```

The complete config should be like this:
```
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        hosts {
           192.168.1.162   eucaim-node.i3m.upv.es harbor.eucaim-node.i3m.upv.es
           fallthrough
        }
        prometheus :9153
        forward . /etc/resolv.conf {
           max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
```

Then delete all the pods with the name starting with "coredns-" in the namespace `kube-system` 
in order to trigger their regeneration loading the new version of the configmap.

So now we can use the name in the image property of containers when we deploy in k8s from inside a pod, 
for example from a desktop using the jobman command.

