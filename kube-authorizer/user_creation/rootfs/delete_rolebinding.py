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
    parser.add_argument(metavar="<NAMESPACE>", dest="namespace", help="Namespace name. If '*' is provided, the script will remove all the rolebindings that apply the <role> indicated to the <user> indicated")
    parser.add_argument(metavar="<ROLE REF NAME>", dest="role_ref", help="Role Ref")
    

    args = parser.parse_args()

    user_type = str(args.user_type).lower()
    if user_type == "oidc-user":
        user_type = "user"
    user_name = str(args.user_name).lower()
    roleref_name = str(args.role_ref).lower()
    namespace = args.namespace
    k8s_endpoint = args.k8s_endpoint
    k8s_token = args.k8s_token

     

    command = "kubectl --server %s --insecure-skip-tls-verify=true --token=%s get -n %s rolebinding -o json" % (k8s_endpoint, k8s_token, namespace)
    if namespace == "*":
        command = "kubectl --server %s --insecure-skip-tls-verify=true --token=%s get -A rolebinding -o json" % (k8s_endpoint, k8s_token)

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

    rolebindings_list = []
    if "items" in json_object:
        rolebindings_list = json_object["items"]

    to_delete = []
    for element in rolebindings_list:
        rb_name = element['metadata']['name']
        rb_namespace = element['metadata']['namespace']
        print ("crb_name -> " + rb_name)
        if str(element['roleRef']['name']).lower() == roleref_name:
            for subject in element['subjects']:
                print ("\tsubject -> " + str(subject))
                if subject['kind'].lower() == user_type and subject['name'].lower() == user_name:
                    to_delete.append({"name":rb_name, "namespace": rb_namespace} )
        #print("-----------------------------------------------------------------------")
    
    print ("Rolebindings found: %s" % str(to_delete))
    for element in to_delete:
        print("Deleting %s from namespace %s..." % (element["name"], element["namespace"]))
        command = "kubectl --server %s --insecure-skip-tls-verify=true --token=%s delete -n %s rolebinding %s" % (k8s_endpoint, k8s_token, element["namespace"], element["name"])
        output, rc = execute_cmd(command, fetch=False)
        print(output)