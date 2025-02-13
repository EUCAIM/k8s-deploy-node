# Deployment

## [Option A - recommended at least for the first installation] Using Helm CLI

First of all, you must create the namespace for the application:
```console
kubectl create namespace dsws-operator
```
Then download the Helm Chart. You can do it from the chart repository previously indicated (harbor), 
or directly from source repository (github):
```console
git clone https://github.com/chaimeleon-eu/k8s-chaimeleon-operator.git
```
Now make a private copy of the values file and change it for your preferences 
([ref](https://github.com/chaimeleon-eu/k8s-chaimeleon-operator/blob/master/chaimeleon-operator-chart/values.yaml)).
```console
cp installation-values.yaml installation-values.private.yaml
```
And finally deploy with:
```console
helm install --namespace dsws-operator dsws-operator ./k8s-chaimeleon-operator/chaimeleon-operator-chart -f installation-values.private.yaml
```

## [Option B] Using Kubeapps

You can use the user friendly web interface of Kubeapps. 

First you must create de namespace using the "Context" dropdown (top right corner), for example "dsws-operator".

Select the new namespace and add a new repository with
Name: 
URL: https://harbor.chaimeleon-eu.i3m.upv.es/chartrepo/chaimeleon-services  
Packaging format: Helm Charts
Scope: Namespaced repository
Package Storage Type: Helm Repository
Filter Applications: chaimeleon-operator

Then you will be able to see it in the catalog.  
Select it, start deployment, give it some name, review the configuration adjusting to your needs and finally deploy.
Take the file `installation-values.yaml` on this directory as a reference.
You can make a private copy for edit and then copy-paste on the web page:
```console
cp installation-values.yaml installation-values.private.yaml
```
Anyway the complete documentation of all the configuration parameters is in 
[ref](https://github.com/chaimeleon-eu/k8s-chaimeleon-operator/blob/master/chaimeleon-operator-chart/values.yaml). 
You will see there that you will need to create a new client in the auth service 
and optionally a new user in guacamole.


# Upgrade

You can upgrade with the Kubeapps web interface or with the helm command:
```console
helm upgrade --namespace dsws-operator dsws-operator ./k8s-chaimeleon-operator/chaimeleon-operator-chart -f installation-values.private.yml
```


## Uninstall

Again you can uninstall with the Kubeapps web interface or with the helm command:
```
sudo helm --namespace dsws-operator delete dsws-operator
```

**IMPORTANT:**  
Whether you uninstall with Kubeapps or with Helm command you must delete the webhooks created by the operator:
```
sudo kubectl get -A validatingwebhookconfigurations
sudo kubectl delete validatingwebhookconfigurations dsws.webhook
sudo kubectl get -A validatingwebhookconfigurations
sudo kubectl get -A mutatingwebhookconfigurations
sudo kubectl delete mutatingwebhookconfigurations dsws.webhook
sudo kubectl get -A mutatingwebhookconfigurations
```
That webhooks are created automatically on running the service the first time, 
but not deleted when the service is stopped because it can be started again without lose any event.
The k8s operations received in the mean time will be blocked, some of them resumed in the next start.
So, in case of uninstall, the deletion of this webhooks is important because the k8s operations will be blocked until you do it.


