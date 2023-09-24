
# Installation

## Service
```
cd install-service
```
Make a private copy of the values file and change it for your preferences:
```console
cp configs.yaml configs.private.yaml
```
Create the namespace: `kubectl create namespace kube-authorizer`
Create the persistent volumes: `kubectl apply -f pvcs.yaml`
Create the configmaps and secrets: `kubectl apply -f configs.private.yaml`
Create the deployment and service for DB: `kubectl apply -f dep_db.yaml`
Create the deployment and service for kube-authorizer: `kubectl apply -f dep_kube-authorizer.yaml`

## Client
First download, extract and install:
```console
cd install-client
wget https://gitlab.com/primageproject/kube-authorizer/-/archive/2.0.0/kube-authorizer-2.0.0.tar.gz
tar xvzf kube-authorizer-2.0.0.tar.gz
cd kube-authorizer-2.0.0
sudo python3 setup-only-cli.py install
sudo chmod +x /usr/bin/kubeauthctl
```
The package inclues both client and service, but we install only the client in this case (the service is running in the k8s cluster)

Optionally you can add autocompletion for command `kubeauthctl` to the bash shell:
```console
sudo bash -c "register-python-argcomplete kubeauthctl > /etc/kube-authorizer/bash_completion_kubeauthctl"
echo "source /etc/kube-authorizer/bash_completion_kubeauthctl" >> ~/.bashrc
```
Then edit the configuration file:
```console
sudo vim /etc/kube-authorizer/kube-authorizer-cli.yaml
```
You must set the cluster ip assigned to the Service deployed previously and the secret token you set in the ConfigMap.


# Usage examples

### See the current status
`kubeauthctl get tenants`
`kubeauthctl describe tenants testdatascientist`
`kubeauthctl describe groups k8s-chaimeleon-users`
`kubeauthctl describe policies k8s_chaimeleon_users`

### Get details of an action:
kubeauthctl describe actions chaimeleon_rb_users

### Create or update an action:  
`kubeauthctl create actions/action_chaimeleon_rb_users.yml`
If it already exist it will be updated, and so applied to new tenants created from now, but not to the existent tenants.
If you want to apply to all the existent tenants you must delete (or comment) from policy (the `deny` part of the previous action will be applied to all the users): 
```
vim policies/policy_k8s_chaimeleon_users.yml
kubeauthctl create policies/policy_k8s_chaimeleon_users.yml
```
And then add again to the policy (the `allow` part of the new action will be applied to all the users):
```
vim policies/policy_k8s_chaimeleon_users.yml
kubeauthctl create policies/policy_k8s_chaimeleon_users.yml
```
---
For the first time, it can be useful to create all the actions from directory "actions":  
`kubeauthctl create -d actions`

### Build and upload user creation container 
(required by many of the actions)
```
docker build -t harbor.chaimeleon-eu.i3m.upv.es/chaimeleon-services/user-creation:1.0.7 user_creation
docker push harbor.chaimeleon-eu.i3m.upv.es/chaimeleon-services/user-creation:1.0.7
```

### Create a new user:
```
cp tenants/existent-user.yaml new-user.yaml
vim tenants/new-user.yaml
kubeauthctl create tenants/new-user.yaml
```
If there are more than one you can do `kubeauthctl create -d tenants` (the actions will be applied only to the new users).

### List the history of actions performed:
```
kubeauthctl get authactions
```

### Re-run an allow action manually:
```
kubeauthctl update authactions allow  311646e1-4734-4c16-bb8e-e8b2f7730947
```

