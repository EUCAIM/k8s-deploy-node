# https://github.com/goharbor/harbor-helm
#https://artifacthub.io/packages/helm/harbor/harbor

kubectl apply -f harbor-namespace.yaml
kubectl apply -f pvc-harbor.yaml

#helm repo add harbor https://helm.goharbor.io
#helm repo update

#git clone -b 1.6.0 https://github.com/goharbor/harbor-helm.git
git clone -b 1.8.0 https://github.com/goharbor/harbor-helm.git

#helm install harbor --namespace harbor  -f values.yml harbor/harbor --version 1.6.0 
helm install harbor --namespace harbor  -f values-persistence.yaml ./harbor-helm
