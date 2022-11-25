#!/bin/bash 

set -x

# Environmental variables required:
#   K8S_ENDPOINT 
#   K8S_TOKEN
#   TENANT_NAMESPACE
#   TENANT_NAME
#   TENANT_TYPE

#----------------------------------------------------------
# CILIUM NETWORK POLICIES
#----------------------------------------------------------
# **************************** 
# Deny Egress traffic
# **************************** 
tpl -e templates/ciliumNetworkPolicy-deny-egress.yml.tpl > /tmp/ciliumNetworkPolicy-deny-egress.yml
echo -e "\n/tmp/ciliumNetworkPolicy-deny-egress.yml:"
cat /tmp/ciliumNetworkPolicy-deny-egress.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the Cilium Network Policy [Deny Egress traffic]..."
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/ciliumNetworkPolicy-deny-egress.yml
echo -e "\n---------------------------------------------------------------"
