# Extra configurations

This section tackles the configuration of the Kubernetes service in order to provide an efficient, multi-tenant and secure computing infrastructure.

Managing users in multiple services and computing infrastructures can be complex. Thus, it is required the use of authentication layers as OpenID Connect (OIDC) to manage a huge number of users.

The tenancy model used at the CHAIMELEON infrastructure can be categorised as a Namespace as a Service tenancy model, which means that everyone that has is authorizer to access to the computing infrastructure has her/his isolate environment named Kubernetes Namespace.

## Enable OIDC in a Kubernetes cluster
The changes of the K8s API Server to enable OIDC using Keycloak are:

###### /etc/kubernetes/manifests/kube-apiserver.yaml
```yaml
- --oidc-issuer-url=https://chaimeleon-eu.i3m.upv.es/auth/realms/CHAIMELEON
- --oidc-client-id=kubernetes
- --oidc-username-claim=username
- '--oidc-username-prefix=oidc:'
- --oidc-groups-claim=groups
- '--oidc-groups-prefix=oidc:'
```

## Tenancy Model - Namespace as a Service 
UPV implemented two event listeners ([Dataset Service Event Listener](https://github.com/chaimeleon-eu/event-listener-datasetservice) and [Kube-authorizer Event Listener](https://github.com/chaimeleon-eu/event-listener-kubeauthorizer)) for Keycloak. These listeners are activated when a new user is included into a certain Keycloak Groups (Data-scientis, external researcher, etc.). The event listeners are in charge of triggering  the configuration of the different services that conform the CHAIMELEON infrastructure:
-  [Dataset Service Event Listener](https://github.com/chaimeleon-eu/event-listener-datasetservice). It triggers the assignation of a GID for the user and to authorize her/his to use the datasets availables for his/her Keycloak Group performed by the _Dataset Service_.
- [Kube-authorizer Event Listener](https://github.com/chaimeleon-eu/event-listener-kubeauthorizer). It triggers the creation of the Namespace in K8s and the other required configurations to ensure the correct use of the platform. This actions are performed by the _Kube-authorizer_.

## Scheduling

Tipically, a computing infrastructure is composed of  a multiple core services applications to provide the desired functionality to their users.

System administrators must ensure that these core services are always running. Thus, there are different types of applications that can be categorized in the following classes:
- __Core services__: they are in charge of mantain a minimal functionality of the cluster. Examples: 
    - :heavy_check_mark: Storage (_CephFS provider_)
    - :heavy_check_mark: Security Policy Management System (_Kyverno_) 
    - :heavy_check_mark: Cluster Management Dashboard (_Kubernetes Dashboard_).
    - :heavy_check_mark: Authentication (_Keycloak_)
    - :heavy_check_mark: Container and Helm Chart Repository (_Harbor_)
    - :heavy_check_mark: Traceability system (_Tracer Service_)
    - :heavy_check_mark: Dataset administration (_Dataset Service_)
    - :heavy_check_mark: Authorization (_Kube-authorizer_)
    - :heavy_check_mark: Kubernetes Operator (_Chaimeleon Operator_).
- __Core applications__: 
    - :heavy_check_mark: Data ingestion (_Quibim Precision_, _PACS_)
    - :heavy_check_mark: Application Launcher & Marketplace Service (_Kubeapps_)
    - :heavy_check_mark: Accessing application Service (_Guacamole_). 
- __Processing Applications__: the applications that are deployed by the infrastructure users. 

### Pod priority
Implementing the classes that are described below can be done using [Kubernetes PriorityClasses](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#priorityclass). [Here](https://github.com/chaimeleon-eu/k8s-deployments/tree/master/extra-configurations/pod-priorities) are availables the YAMLs that permits manage the priority between the diffent pods in the infrastructure. Furthermore, it is required a Kyverno policy to ensure that CHAIMELEON users only use the _Processing Application_ PriorityClass.

Example of PriorityClass:
```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: processing-applications
value: 1000000
globalDefault: true
preemptionPolicy: Never
description: "This priority class should be used for processing applications that are deployed by the CHAIMELEON users."
```


### Pod preemtion

"When Pods are created, they go to a queue and wait to be scheduled. The scheduler picks a Pod from the queue and tries to schedule it on a Node. If no Node is found that satisfies all the specified requirements of the Pod, preemption logic is triggered for the pending Pod. Let's call the pending Pod P. Preemption logic tries to find a Node where removal of one or more Pods with lower priority than P would enable P to be scheduled on that Node. If such a Node is found, one or more lower priority Pods get evicted from the Node. After the Pods are gone, P can be scheduled on the Node." Source: [here](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#preemption).

- PreemptionPolicy: 
    -  _PreemptLowerPriority_: allow pods of that PriorityClass to preempt lower-priority pods (as is existing default behavior).
    - _Never_: pods in that PriorityClass will be non-preempting.


### Quality of Service

QoS Classes (depending on the priority):
- _Guaranteee_: Pods  __not be killed until they exceed their limits__. Requirements:
    - Every Container in the Pod must have a __memory limit__, __memory request__,  __CPU limit__, and __CPU request__.
    - For every Container in the Pod, the __memory limit__ must __equal__ the __memory request__.
    - For every Container in the Pod, the __CPU limit__ must __equal__ the __CPU request__.
- _Burstable_: Pods have some form of __minimal resource guarantee__ and can use __more resources when available__. Under system memory pressure, __it can be killed to allocate _Guarantee Pods_ if there are not _Best effort pods___. Requirements:
    - Every Container in the Pod must have a __memory request__, and __CPU request__.
- _Best effort_: Pods will be treated as __lowest priority__. Processes in these pods are the first to get killed if the system runs out of memory. These containers can use any amount of free memory in the node though.

## Resource quotas
"A resource quota, defined by a ResourceQuota object, provides constraints that __limit aggregate resource consumption per namespace__. It can limit the __quantity of objects__ that can be created in a namespace by type, as well as the total __amount of compute resources that may be consumed__ by resources in that namespace." Source: [here](https://kubernetes.io/docs/concepts/policy/resource-quotas/). 

Using resource quotas we can limit:
- CPU (limit and request)
- RAM Memory (limit and request)
- GPUs
- Storage (the complete amount of the PVCs)
- Count of the different K8s objects (services, deployments, configmaps, etc.)

Resource quota can be applied depending on the PriorityClass but, using this way, it is not possible to limit _"requests.nvidia.com/gpu"_. 

Example of possible ResourceQuota:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: chaimeleon-users
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 25Gi
    requests.storage: 25Gi
    limits.cpu: "6"
    limits.memory: 50Gi
    requests.nvidia.com/gpu: 2
```

### Ceph Resource Quota

Persistent storage resource quota cannot be limited by K8s because the access mode is directly throught PV instead of PVC. [Here](https://access.redhat.com/documentation/en-us/red_hat_ceph_storage/4/html/file_system_guide/ceph-file-system-administration#ceph-file-system-quotas_fs) is the information for use this feature in Cehp.

The method is very simple, we only have to set the quota in bytes to her/his persistent home:
```console
getfattr -n ceph.quota.max_bytes DIRECTORY
```

__TBD -> configure it in the CHAIMELEON cluster__ 

## Automatic acquisition and renewal of certificates

There are some subdomains where services and applications are accesible, so we need two certificates:
 - _chaimeleon-eu.i3m.upv.es_: for the Kubernetes dashboard and the rest of services and applications 
                               (one certificate for all, they will be differentiated by path).
 - _harbor.chaimeleon-eu.i3m.upv.es_: for the Harbor services and webUI.
 - _hubble.chaimeleon-eu.grycap.i3m.upv.es_: for the Hubble application.
 - _chaimeleon-test.grycap.i3m.upv.es_: for test deployments. 

### Certificate for Kubernetes-dashboard and all other services/apps

All the services and applications will be accessible through the ingress proxy which will be accepting connections in the HTTPS port for the main subdomain _chaimeleon-eu.i3m.upv.es_.

The services/apps (including those deployed by the users) will be differentiated by the path:
 - https://chaimeleon-eu.i3m.upv.es/dashboard/
 - https://chaimeleon-eu.i3m.upv.es/dataset-service/
 - https://chaimeleon-eu.i3m.upv.es/apps/
 - ...

We use cert-manager to automatically obtain and renew certificates. 
The installation and configuration to obtain the certificate for this main subdomain is done automatically by our Ansible role:
https://github.com/chaimeleon-eu/recipes/blob/master/chaimeleon-kubernetes.radl

The configuration lines for that:
```
    kube_cert_manager: true
    kube_install_ingress: true      
    kube_deploy_dashboard: true
    kube_cert_user_email: serlohu@upv.es
    kube_public_dns_name: chaimeleon-eu.i3m.upv.es
```

Just for information, this is what happens underneath...  
First, a cluster-issuer (k8s object) is created to configure the access to Let's Encrypt. 
The definition is like this:
```yaml
apiVersion: cert-manager.io/v1alpha2
kind: ClusterIssuer
metadata:
    name: letsencrypt-prod
spec:
  acme:
    server:  https://acme-v02.api.letsencrypt.org/directory
    email:  serlohu@upv.es
    privateKeySecretRef:
      name:  letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class:  nginx
```

Then, an ingress (k8s object) is created like this:
```yaml
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/backend-protocol: HTTPS
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  tls:
    - hosts:
        - chaimeleon-eu.i3m.upv.es
      secretName: chaimeleon-eu.i3m.upv.es
  rules:
    - host: chaimeleon-eu.i3m.upv.es
      http:
        paths:
          - path: /dashboard/?(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: kubernetes-dashboard
                port:
                  number: 8443
```
This object configures the nginx proxy to redirect all the paths prefixed with "/dashboard/" to the kubernetes-dashboard service using HTTPS protocol and with the certificate contained in the secret specified by _secretName_.  
One important line is the first annotation that makes cert-manager to use the "letsencrypt-prod" cluster-issuer to obtain the certificate. That line causes a certificate (k8s) object will be automatically created to keep track of the status of the certificate. The certificate will be adquired for the domain specified in the _hosts_ section of the ingress and it will be saved in the specified secret.

This is the certificate object created:
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
    name: chaimeleon-eu.i3m.upv.es
    namespace:    kubernetes-dashboard
spec:
  dnsNames:
    - "chaimeleon-eu.i3m.upv.es"
  issuerRef:
    group:      cert-manager.io
    kind:       ClusterIssuer
    name:       letsencrypt-prod
  secretName:  chaimeleon-eu.i3m.upv.es
```
We can see the status with the command:  
`kubectl describe certificate chaimeleon-eu.i3m.upv.es -n kubernetes-dashboard`.  
And we can see the contents of the certificate with:  
`kubectl get secret chaimeleon-eu.i3m.upv.es -n kubernetes-dashboard -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout`  
Or just the issuer and dates with:  
`kubectl get secret chaimeleon-eu.i3m.upv.es -n kubernetes-dashboard -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -dates -noout -issuer`  

__The rest of services/apps__

Now, for the rest of services/apps to deploy (across different namespaces), we will have to create an ingress (k8s object) (one for each) with 
 - the same subdomain (_spec.rules[].host_),
 - a different prefix for each (_spec.rules[].http.paths[].path_), 
 - not include the section _spec.tls_ (if you do it, you must set the same certificate**),
 - and obviously not include either the "cert-manager.io/cluster-issuer" annotation line to adquire the certificate (this is important to avoid requesting the certificate multiple times to Let's Encrypt, they can block us for that)
 
Example:
```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: dataset-service-backend-proxy
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$1
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
spec:
# tls: section not required, it is already defined for that host in the kubernetes-dashboard ingress
  rules:
    - host: chaimeleon-eu.i3m.upv.es         # the same subdomain for all services
      http:
        paths:
          - path: /dataset-service/?(.*)           # different prefix for each service
            backend:
              serviceName: dataset-service-backend-service
              servicePort: 11000
```
 
** The first created Ingress object for a host creates the rule in the nginx configuration. So when our kubernetes-dashboard service is deployed, the first ingress object is created and causes the creation of the nginx rule with the certificate to be used for that host. Then, the _spec.tls_ section of any other ingress object created with the same host will be ignored. 

Note we are using the k8s [community ingress controler](https://github.com/kubernetes/ingress-nginx) (based on NGINX).  
If you use the alternative [NGINX's ingress controler](https://github.com/nginxinc/kubernetes-ingress) it is not possible to create two or more ingress objects with the same host (there would be a conflict and only one is the winner). In that case you should use mergeable-ingress-type annotation (master and minions). It is better explained [here](https://diazjf.github.io/2018/05/15/kubernetes-nginx-mergeable-types.html), and [here](https://github.com/nginxinc/kubernetes-ingress/tree/master/examples/mergeable-ingress-types) is an example. 


### Certificate for Harbor

This is a special service/app that we put in a dedicated subdomain, so we need another certificate.
The simplest way to configure cert-manager to automatically get and renew the certificate is to add the annotation in the ingress (k8s) object for the Harbor service.

So, the _expose_ section of the "values.yaml" file for deploying the Harbor service looks like this:
```yaml
expose:
  type: ingress
  tls:
    enabled: true
    certSource: secret
    secret:
      secretName: harbor.chaimeleon-eu.i3m.upv.es
  ingress:
    harbor:
      annotations:
        cert-manager.io/cluster-issuer: letsencrypt-prod
    hosts:
      core: harbor.chaimeleon-eu.i3m.upv.es
```
The effects of the annotation line are explained in the previous section.

### Certificate for Habble

This is another special application...

### Certificate for test deployments subdomain

The acquisition of the certificate is carried out by the first deployment we needed which is QuibimPrecision and allows us to obtain the certificate just adding this lines in the "values.yaml":
```yaml
ingress:
  host: "chaimeleon-test.grycap.i3m.upv.es"
  port:
  path: omni
  includeCertManagerAnnotation: true
  # If you want to generate a certificate for this domain, set the previous to true and the next to an existent cluster-issuer
  clusterIssuer: "letsencrypt-prod"
```
