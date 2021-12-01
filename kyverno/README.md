## __kyverno-values.yml:__
Keycloak configuration parameters:
- Line 29: ``podSecurityStandard``: _"baseline"_. Options: https://kyverno.io/policies/pod-security/
- Line 31: ``validationFailureAction``: _"enforce"_.


# Deployment

First, add kyverno chart repository:
```console
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
```
Then, install the Kyverno CustomResourceDefinition:
```console
# Beginning with Kyverno 1.4.2, Kyverno Helm chart v2.0.2, the Kyverno CRDs must be added seperately and before Kyverno is installed.
helm install kyverno-crds kyverno/kyverno-crds --namespace kyverno --create-namespace
```

After that, deploy Kyverno:
```console
helm install kyverno  --namespace kyverno -f kyverno-values.yml kyverno/kyverno
```

# Additional policies
Before add the policies availables at [policies directory](https://github.com/chaimeleon-eu/k8s-deployments/tree/master/kyverno/policies), you will can test them using the following commands:
```console
docker run -it -v /path/to/k8s-deployments/kyverno/policies:/policies gbaeke/kyverno-cli "kyverno test /policies"
```
If the Github repository is public, you also can test them executing:
```console
docker run -it gbaeke/kyverno-cli "kyverno test https://github.com/chaimeleon-eu/k8s-deployme
nts/tree/master/kyverno/policies"
```

