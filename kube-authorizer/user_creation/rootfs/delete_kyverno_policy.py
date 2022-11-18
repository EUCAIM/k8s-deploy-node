#! /usr/bin/env python3

import subprocess
import shlex
import argparse
import json
import sys

def execute_cmd (cmd_string, fetch=True):
    '''
    fetch: if True, return a list. Otherwise, return string
    '''
    #str_cmd = []
    #for e in cmd:
    #    str_cmd.append( str(e) )
    print ('Executing "' + cmd_string + '"...' )
    args = shlex.split(cmd_string)

    p = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    rc = p.returncode

    output = err
    if rc == 0:
        output = out

    if fetch:
        output = output.split('\n')

    return output, rc 


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    #subparsers = parser.add_subparsers(title='Commands', dest='command')
    parser.add_argument(metavar="<K8S ENDPOINT>", dest="k8s_endpoint", help="Kubernetes endpoint")
    parser.add_argument(metavar="<K8S TOKEN>", dest="k8s_token", help="Kubernetes token")
    parser.add_argument(metavar="<USER KIND>", dest="user_type", help="Kind of k8s user", choices=["oidc-user", "serviceaccount"] )
    parser.add_argument(metavar="<USER NAME>", dest="user_name", help="User name")
    parser.add_argument(metavar="<CLUSTER POLICY NAME>", dest="cluster_policy_name", help="Kyverno Cluster policy name")
    
#    $$K8S_ENDPOINT $$K8S_TOKEN $$KUBE_AUTH_TENANT_TYPE oidc:$$KUBE_AUTH_TENANT_USERNAME ingress-subpath-$$KUBE_AUTH_TENANT_USERNAME

    args = parser.parse_args()

    user_type = str(args.user_type).lower()
    user_name = str(args.user_name).lower()
    cluster_policy_name = str(args.cluster_policy_name).lower()
    k8s_endpoint = args.k8s_endpoint
    k8s_token = args.k8s_token

    print("user_type=%s" % user_type)
    print("user_name=%s" % user_name)
    print("cluster_policy_name=%s" % cluster_policy_name)

    command = "kubectl --server %s --insecure-skip-tls-verify=true --token=%s get clusterpolicy -o json" % (k8s_endpoint, k8s_token)
    
    output, rc = execute_cmd(command, fetch=False)
    json_object = None
    if rc == 0:
        try:
            json_object = json.loads(output)
        except ValueError as e:
            print("Error: %s" % e)
            sys.exit(1)
    else:
        print("Error: %s" % output)
        sys.exit(1)

    clusterpolicy_list = []
    if "items" in json_object:
        clusterpolicy_list = json_object["items"]

    to_delete = []
    for element in clusterpolicy_list:
        resource_name = element['metadata']['name']
        print ("resource_name -> " + resource_name)
        #print(element['metadata']['annotations'])
        if 'chaimeleon/kyverno-policy-name' in element['metadata']['annotations'] and 'chaimeleon/kyverno-tenant-name' in element['metadata']['annotations'] and 'chaimeleon/kyverno-tenant-type' in element['metadata']['annotations']:
            #print("chaimeleon/kyverno-policy-name -> %s" % str(element['metadata']['annotations']['chaimeleon/kyverno-policy-name']).lower())
            #print("chaimeleon/kyverno-tenant-name -> %s" % str(element['metadata']['annotations']['chaimeleon/kyverno-tenant-name']).lower())
            #print("chaimeleon/kyverno-tenant-type -> %s" % str(element['metadata']['annotations']['chaimeleon/kyverno-tenant-type']).lower())
            
            if str(element['metadata']['annotations']['chaimeleon/kyverno-policy-name']).lower() == cluster_policy_name and  str(element['metadata']['annotations']['chaimeleon/kyverno-tenant-name']).lower() == user_name and str(element['metadata']['annotations']['chaimeleon/kyverno-tenant-type']).lower() == user_type:
                to_delete.append({ "name": resource_name })
                
        #print("-----------------------------------------------------------------------")
    
    print ("Kyverno Cluster policy found: %s" % str(to_delete))
    for element in to_delete:
        print("Deleting %s ..." % (element["name"]))
        command = "kubectl --server %s --insecure-skip-tls-verify=true --token=%s delete clusterpolicy %s" % (k8s_endpoint, k8s_token, element["name"])
        output, rc = execute_cmd(command, fetch=False)
        print(output)