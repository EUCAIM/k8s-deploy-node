# Multi-tenancy

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

## Namespace as a Service 
UPV implemented two event listeners ([Dataset Service Event Listener](https://github.com/chaimeleon-eu/event-listener-datasetservice) and [Kube-authorizer Event Listener](https://github.com/chaimeleon-eu/event-listener-kubeauthorizer)) for Keycloak. These listeners are activated when a new user is included into a certain Keycloak Groups (Data-scientis, external researcher, etc.). The event listeners are in charge of triggering  the configuration of the different services that conform the CHAIMELEON infrastructure:
-  [Dataset Service Event Listener](https://github.com/chaimeleon-eu/event-listener-datasetservice). It triggers the assignation of a GID for the user and to authorize her/his to use the datasets availables for his/her Keycloak Group performed by the _Dataset Service_.
- [Kube-authorizer Event Listener](https://github.com/chaimeleon-eu/event-listener-kubeauthorizer). It triggers the creation of the Namespace in K8s and the other required configurations to ensure the correct use of the platform. This actions are performed by the _Kube-authorizer_.

## Quality of Service

Tipically, a computing infrastructure is composed of  a multiple core services applications to provide the desired functionality to their users.

System administrators must ensure that these core services are always running. Thus, there are different types of applications that can be categorized in the following classes:
- __Core services__: they are in charge of mantain a minimal functionality of the cluster. Examples: 
    - Authentication (_Keycloak_)
    - Storage (_CephFS provider_)
    - Authorization (_Kube-authorizer_)
    - Security Policy Management System (_Kyverno_) 
    - Dataset administration (_Dataset Service_)
    - Traceability system (_Tracer Service_)
    - Container and Helm Chart Repository (_Harbor_)
    - Kubernetes Operator (_Chaimeleon Operator_).
- __Core applications__: 
    - Data ingestion (_Quibim Precision_, _PACS_)
    - Application Launcher & Marketplace Service (_Kubeapps_)
    - Accessing application Service (_Guacamole_). 
- __Processing Applications__: the applications that are deployed by the infrastructure users. 

### Pod priority
Implementing the classes that are described below can be done using [Kubernetes PriorityClasses](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#priorityclass). [Here](https://github.com/chaimeleon-eu/k8s-deployments/tree/master/multi-tenancy/pod-priorities) are availables the YAMLs that permits manage the priority between the diffent pods in the infrastructure. Furthermore, it is required a Kyverno policy to ensure that CHAIMELEON users only use the _Processing Application_ PriorityClass.

### Pod preemtion

"When Pods are created, they go to a queue and wait to be scheduled. The scheduler picks a Pod from the queue and tries to schedule it on a Node. If no Node is found that satisfies all the specified requirements of the Pod, preemption logic is triggered for the pending Pod. Let's call the pending Pod P. Preemption logic tries to find a Node where removal of one or more Pods with lower priority than P would enable P to be scheduled on that Node. If such a Node is found, one or more lower priority Pods get evicted from the Node. After the Pods are gone, P can be scheduled on the Node." Source: [here](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#preemption).

- PreemptionPolicy: 
    -  _PreemptLowerPriority_: allow pods of that PriorityClass to preempt lower-priority pods (as is existing default behavior).
    - _Never_: pods in that PriorityClass will be non-preempting.


