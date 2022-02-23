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
    - :heavy_check_mark: Container and Helm Chart Repository (_Harbor_)
    - :heavy_check_mark: Authentication (_Keycloak_)
    - :heavy_check_mark: Storage (_CephFS provider_)
    - :heavy_check_mark: Security Policy Management System (_Kyverno_) 
    - :heavy_check_mark: Dataset administration (_Dataset Service_)
    - :heavy_check_mark: Authorization (_Kube-authorizer_)
    - :heavy_check_mark: Traceability system (_Tracer Service_)
    - :heavy_check_mark: Kubernetes Operator (_Chaimeleon Operator_).
    - :heavy_check_mark: Cluster Management Dashboard (_Kubernetes Dashboard_).
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
