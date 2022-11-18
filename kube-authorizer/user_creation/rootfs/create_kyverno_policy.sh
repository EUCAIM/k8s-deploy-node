#!/bin/bash 

set -x

# Environmental variables required:
#   K8S_ENDPOINT 
#   K8S_TOKEN
#   KYVERNO_TEMPLATE_PATH
#   TENANT_TYPE
#   TENANT_NAME
#   TENANT_NAMESPACE


#----------------------------------------------------------
# KYVERNO POLOCIES
#----------------------------------------------------------
# **************************** 
# Security context
# **************************** 

#tpl -e ${KYVERNO_TEMPLATE_PATH} > /tmp/kyverno_policy.yml
sed 's/{{ TENANT_TYPE }}/'${TENANT_TYPE}'/g' ${KYVERNO_TEMPLATE_PATH} > /tmp/kyverno_policy.yml
sed -i 's/{{ TENANT_NAME }}/'${TENANT_NAME}'/g' /tmp/kyverno_policy.yml
sed -i 's/{{ TENANT_NAMESPACE }}/'${TENANT_NAMESPACE}'/g' /tmp/kyverno_policy.yml

echo -e "\n---------------------------------------------------------------"
echo -e "/tmp/kyverno_policy.yml:"
cat /tmp/kyverno_policy.yml
echo -e "\n---------------------------------------------------------------"
echo -e "\nCreating the Kyverno policy..."
kubectl --server ${K8S_ENDPOINT} --insecure-skip-tls-verify=true --token=${K8S_TOKEN} apply -f /tmp/kyverno_policy.yml
