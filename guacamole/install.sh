# Create namespace

kubectl apply -f guacamole-namespace.yaml

# Create PVC for Post -> guacamole-postgresql
kubectl apply -f postgresql-pvc.yaml

# Deploy postgresql
#   https://github.com/bitnami/charts/tree/master/bitnami/postgresql
#   
helm repo add bitnami https://charts.bitnami.com/bitnami
#helm install --name postgresql --namespace guacamole  -f postgresql-values.yaml  bitnami/postgresql

helm -n oidc-guacamole install oidc-postgresql -f postgresql-values.yaml  bitnami/postgresql --version 10.3.13
#helm -n oidc-guacamole upgrade oidc-postgresql -f postgresql-values.yaml  bitnami/postgresql --version 10.3.13

# Deploy Guacamole
#   https://artifacthub.io/packages/helm/halkeye/guacamole
#   https://github.com/halkeye-helm-charts/guacamole

#helm install --name guacamole --namespace guacamole  -f guacamole-values.yaml halkeye/guacamole

helm install oidc-guacamole --namespace oidc-guacamole  -f guacamole-values.yml ./guacamole-edit
#helm -n oidc-guacamole upgrade oidc-guacamole -f guacamole-oidc-values.yaml  ./helm-chart-guacamole --version 0.3.0


#https://chaimeleon-eu.i3m.upv.es/guacamole/#/

# Create admin user
# https://stackoverflow.com/questions/59862016/apache-guacamole-create-user-using-postgres