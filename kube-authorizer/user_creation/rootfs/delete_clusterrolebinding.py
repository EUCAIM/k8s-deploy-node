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
    parser.add_argument(metavar="<CLUSTER ROLE REF NAME>", dest="role_ref", help="Role Ref")

    args = parser.parse_args()

    user_type = str(args.user_type).lower()
    if user_type == "oidc-user":
        user_type = "user"
    user_name = str(args.user_name).lower()
    roleref_name = str(args.role_ref).lower()
    k8s_endpoint = args.k8s_endpoint
    k8s_token = args.k8s_token

    command = "kubectl --server %s --insecure-skip-tls-verify=true --token=%s get clusterrolebinding -o json" % (k8s_endpoint, k8s_token)
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

    clusterrolebinding_list = []
    if "items" in json_object:
        clusterrolebinding_list = json_object["items"]

    to_delete = []
    for element in clusterrolebinding_list:
        crb_name = element['metadata']['name']
        #print ("crb_name -> " + crb_name)
        if str(element['roleRef']['name']).lower() == roleref_name:
            for subject in element['subjects']:
                #print ("subject -> " + str(subject))
                if subject['kind'].lower() == user_type and subject['name'].lower() == user_name:
                    to_delete.append(crb_name)
        #print("-----------------------------------------------------------------------")
    
    print ("ClusterRoleBindings found: %s" % str(to_delete))
    for element in to_delete:
        print("Deleting %s..." % element)
        command ="kubectl --server %s --insecure-skip-tls-verify=true --token=%s delete clusterrolebinding %s" % (k8s_endpoint, k8s_token, element)
        output, rc = execute_cmd(command, fetch=False)
        print(output)