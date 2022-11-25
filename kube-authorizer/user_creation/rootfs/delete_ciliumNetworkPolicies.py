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
    parser.add_argument(metavar="<USER NAMESPACE>", dest="user_namespace", help="User namespace")
    parser.add_argument(metavar="<CILIUM NETWORK POLICY NAME>", dest="cilium_network_policy_name", help="Cilium network policy name")
    
    args = parser.parse_args()

    user_type = str(args.user_type).lower()
    user_name = str(args.user_name).lower()
    user_namespace = str(args.user_namespace).lower()
    cilium_network_policy_name = str(args.cilium_network_policy_name).lower()
    k8s_endpoint = args.k8s_endpoint
    k8s_token = args.k8s_token

    print("user_type=%s" % user_type)
    print("user_name=%s" % user_name)
    print("user_namespace=%s" % user_namespace)
    print("cilium_network_policy_name=%s" % cilium_network_policy_name)

    command = "kubectl --server %s --insecure-skip-tls-verify=true --token=%s get ciliumnetworkpolicy -n %s -o json" % (k8s_endpoint, k8s_token, user_namespace)
    
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
        if 'chaimeleon/cilium-network-policy-name' in element['metadata']['annotations'] and 'chaimeleon/cilium-tenant-name' in element['metadata']['annotations'] and 'chaimeleon/cilium-tenant-type' in element['metadata']['annotations']:

            if str(element['metadata']['namespace']).lower() == user_namespace and str(element['metadata']['annotations']['chaimeleon/cilium-network-policy-name']).lower() == cilium_network_policy_name and  str(element['metadata']['annotations']['chaimeleon/cilium-tenant-name']).lower() == user_name and str(element['metadata']['annotations']['chaimeleon/cilium-tenant-type']).lower() == user_type:
                to_delete.append({ "name": resource_name, "namespace": user_namespace })
    
    print ("Cilium network policies found: %s" % str(to_delete))
    for element in to_delete:
        print("Deleting %s from %s ..." % (element["name"], ["namespace"]) )
        command = "kubectl --server %s --insecure-skip-tls-verify=true --token=%s delete -n %s ciliumnetworkpolicy %s" % (k8s_endpoint, k8s_token, element["namespace"], element["name"])
        output, rc = execute_cmd(command, fetch=False)
        print(output)