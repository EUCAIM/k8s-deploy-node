git clone https://github.com/chaimeleon-eu/k8s-chaimeleon-operator.git

helm install chaimeleon-operator ./k8s-chaimeleon-operator/chaimeleon-operator-chart -f installation-values.yml --namespace chaimeleon-operator --create-namespace 