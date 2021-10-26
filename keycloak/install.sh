#!/bin/bash
kubectl apply -f dep0_namespace.yaml 
kubectl apply -f dep0_volumes.yaml
kubectl apply -f dep1_init_volumes.yaml
kubectl apply -f dep2_database.yaml
kubectl apply -f dep3_keycloak_v2.yaml
kubectl apply -f dep4_ingress.yaml

echo ""
echo "Keycloak:                 HOST/auth" 
echo "Keycloak Admin Console:   HOST/auth/admin" 
echo "Keycloak Account Console: HOST/auth/realms/myrealm/account" 
echo ""

