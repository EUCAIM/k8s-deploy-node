# DOC: https://github.com/kubeapps/kubeapps/blob/master/docs/user/using-an-OIDC-provider.md

# Enable kubernetes plugin for OIDC authentication
# DOC: https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens
vim /etc/kubernetes/manifests/kube-apiserver.yaml
# Add the following parameters to the command:
#   - --oidc-issuer-url=https://chaimeleon-eu.i3m.upv.es/auth/realms/CHAIMELEON
#   - --oidc-client-id=kubernetes
#   - --oidc-username-claim=username
#   - '--oidc-username-prefix=oidc:'
#   - --oidc-groups-claim=groups
#   - '--oidc-groups-prefix=oidc:'

# On saving, a new pod for kube-apiserver should be automatically deployed with the new configuration, 
# but to ensure the changes, better restart kubelet service
service kubelet restart
# After that, the params should appear in the current pod manifest:
kubectl -n kube-system get pod -l component=kube-apiserver -o yaml | grep oidc
# showing:
#   - --oidc-issuer-url=https://chaimeleon-eu.i3m.upv.es/auth/realms/CHAIMELEON
#   - --oidc-client-id=kubernetes
#   - --oidc-username-claim=username
#   - '--oidc-username-prefix=oidc:'
#   - --oidc-groups-claim=groups
#   - '--oidc-groups-prefix=oidc:'

# We can use kubectl for testing oidc access: https://kubernetes.io/docs/reference/access-authn-authz/authentication/#using-kubectl
# Not tried.

##############################
# Create a client in Keycloak for kubernetes
#   Client ID: kubernetes
#   Protocol: openid-conect
#   Access Type: confidential  (after save, "Credentials" tab appears, go on and anotate the secret for kubeapps configuration)
#   Valid Redirect URIs: https://chaimeleon-eu.i3m.upv.es/*


##############################
# Create namespace for Kubeapps
kubectl apply -f kubeapps-namespace.yaml

# Create volume previously with the name that the chart expects
kubectl apply -f postgresql-pvc.yaml
# Launch a small pod just for set permissions in volume for the user 1001 
# (because in kubeapps-postgresql statefulSet there is a "spec.template.spec.containers[0].securityContext.runAsUser: 1001")
kubectl apply -f prepare-postgresql-pvc.yaml

# Configure values for kubeapps
# DOC: https://github.com/kubeapps/kubeapps/tree/master/chart/kubeapps#parameters
vim kubeapps-values.yaml
# In authProxy, set the clientId and clientSecret generated previously in Keycloak

# Install kubeapps
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install kubeapps --namespace kubeapps -f kubeapps-values.yaml bitnami/kubeapps

##############################
# Authorization management
# DOC: https://github.com/kubeapps/kubeapps/blob/master/docs/user/access-control.md

kubectl apply -f rolebindings.yml

