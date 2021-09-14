# Create namespace

kubectl apply -f guacamole-namespace.yaml

# Create PVC for Post -> guacamole-postgresql
kubectl apply -f postgresql-pvc.yaml

# Deploy postgresql
#   https://github.com/bitnami/charts/tree/master/bitnami/postgresql
#   
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install --name postgresql --namespace guacamole  -f postgresql-values.yaml  bitnami/postgresql

# Deploy Guacamole
#   https://artifacthub.io/packages/helm/halkeye/guacamole
#   https://github.com/halkeye-helm-charts/guacamole

helm install --name guacamole --namespace guacamole  -f guacamole-values.yaml halkeye/guacamole


#https://chaimeleon-eu.i3m.upv.es/guacamole/#/

# Create admin user
# https://stackoverflow.com/questions/59862016/apache-guacamole-create-user-using-postgres