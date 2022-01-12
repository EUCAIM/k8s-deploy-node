helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update

# Beginning with Kyverno 1.4.2, Kyverno Helm chart v2.0.2, the Kyverno CRDs must be added seperately and before Kyverno is installed.
helm install kyverno-crds kyverno/kyverno-crds --namespace kyverno --create-namespace

helm install kyverno  --namespace kyverno -f kyverno-values.yml kyverno/kyverno
#helm -n kyverno upgrade kyverno -f kyverno-values.yml kyverno/kyverno --version 2.0.3

helm repo add policy-reporter https://kyverno.github.io/policy-reporter
helm repo update

helm install policy-reporter --namespace kyverno -f policyreporter-values.yml  policy-reporter/policy-reporter 

#kubectl port-forward service/policy-reporter-ui 12000:8080 -n kyverno