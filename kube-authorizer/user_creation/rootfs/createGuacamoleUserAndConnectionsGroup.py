#!/usr/bin/python
import os
import json
import argparse
import http.client
from getpass import getpass
import urllib.parse
from datetime import datetime
import socket

DEBUG = False

def guacamole_login(connection, path, user, password):
    payload = urllib.parse.urlencode({'username' : user, 'password' : password})
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    connection.request("POST", path+"api/tokens", payload, headers)
    res = connection.getresponse()
    httpStatusCode = res.status
    msg = res.read()  # whole response must be readed in order to do more requests using the same connection
    if httpStatusCode != 200:
        print('Login error. Code: %d %s' % (httpStatusCode, res.reason))
        print(msg)
        return ''
    else:
        print('Login success.')
        response = json.loads(msg)
        #print(response)
        return response['authToken']

def existsUser(connection, path, token, userName):
    payload = ''
    headers = {}
    connection.request("GET", path+"api/session/data/postgresql/users?token="+token, payload, headers)
    res = connection.getresponse()
    httpStatusCode = res.status
    msg = res.read()  # whole response must be readed in order to do more requests using the same connection
    if httpStatusCode != 200:
        print('Error getting users. Code: %d %s' % (httpStatusCode, res.reason))
        print(msg)
        return -1
    
    response = json.loads(msg)
    if userName in response.keys():
        return True
    else: 
        return False

def existsConnectionGroup(connection, path, token, connectionGroupName):
    payload = ''
    headers = {}
    connection.request("GET", path+"api/session/data/postgresql/connectionGroups/ROOT/tree?token="+token, payload, headers)
    res = connection.getresponse()
    httpStatusCode = res.status
    msg = res.read()  # whole response must be readed in order to do more requests using the same connection
    if httpStatusCode != 200:
        print('Error getting connection groups. Code: %d %s' % (httpStatusCode, res.reason))
        print(msg)
        return -1
    
    response = json.loads(msg)
    groupId = 'ROOT'
    for group in response['childConnectionGroups']:
        if group['name'] == connectionGroupName: 
            return True
    return False

def createUser(connection, path, token, userName, password):
    newUser = {
        "username": userName,
        "password": password,
        "attributes": {
            "disabled":"",
            "expired":"",
            "access-window-start":"",
            "access-window-end":"",
            "valid-from":"",
            "valid-until":"",
            "timezone":None
        }
    }
    payload = json.dumps(newUser)
    if DEBUG: print(payload)
    headers = {'Content-Type': 'application/json;charset=UTF-8'}
    connection.request("POST", path+"api/session/data/postgresql/users?token="+token, payload, headers)
    res = connection.getresponse()
    httpStatusCode = res.status
    msg = res.read()  # whole response must be readed in order to do more requests using the same connection
    if httpStatusCode != 200:
        print('Error creating the user. Code: %d %s' % (httpStatusCode, res.reason))
        print(msg)
        return False
    #print('.', end='')
    return True

def changePasswordToUser(connection, path, token, userName, password):
    user = {
        "username": userName,
        "password": password,
        "attributes": {
            # "guac-email-address":None,
            # "guac-organizational-role":None,
            # "guac-full-name":None,
            "expired":"",
            "timezone":None,
            "access-window-start":"",
            # "guac-organization":None,
            "access-window-end":"",
            "disabled":"",
            "valid-until":"",
            "valid-from":""
        },
        # "lastActive":1636377547779
    }
    payload = json.dumps(user)
    if DEBUG: print(payload)
    headers = {'Content-Type': 'application/json;charset=UTF-8'}
    connection.request("PUT", path+"api/session/data/postgresql/users/"+userName+"?token="+token, payload, headers)
    res = connection.getresponse()
    httpStatusCode = res.status
    msg = res.read()  # whole response must be readed in order to do more requests using the same connection
    if httpStatusCode != 204:
        print('Error modifying the user. Code: %d %s' % (httpStatusCode, res.reason))
        print(msg)
        return False
    return True
    
def createConnectionGroup(connection, path, token, connectionGroupName):
    newConnectionGroup = {
        "parentIdentifier": "ROOT",
        "name": connectionGroupName,
        "type": "ORGANIZATIONAL",
        "attributes":{
            "max-connections":"",
            "max-connections-per-user":"",
            "enable-session-affinity":""
        }
    }
    payload = json.dumps(newConnectionGroup)
    if DEBUG: print(payload)
    headers = {'Content-Type': 'application/json;charset=UTF-8'}
    connection.request("POST", path+"api/session/data/postgresql/connectionGroups?token="+token, payload, headers)
    res = connection.getresponse()
    httpStatusCode = res.status
    msg = res.read()  # whole response must be readed in order to do more requests using the same connection
    if httpStatusCode != 200:
        print('Error creating the connection group for the user. Code: %d %s' % (httpStatusCode, res.reason))
        print(msg)
        return False
    return True

def changePermissionToUser(connection, path, token, userName, operation, permissionName): 
    permissions = [{"op": operation, "path":"/systemPermissions", "value": permissionName }]
    payload = json.dumps(permissions)
    if DEBUG: print(payload)
    headers = {'Content-Type': 'application/json;charset=UTF-8'}
    connection.request("PATCH", path+"api/session/data/postgresql/users/"+userName+"/permissions?token="+token, payload, headers)
    res = connection.getresponse()
    httpStatusCode = res.status
    msg = res.read()  # whole response must be readed in order to do more requests using the same connection
    if httpStatusCode != 204:
        print('Error setting permissions for the user. Code: %d %s' % (httpStatusCode, res.reason))
        print(msg)
        return False
    return True
       

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='This script creates a user in guacamole database and a private connection group with the same name of the user.' 
                                               + 'To do that, you must have access to the guacamole API-REST endpoint with a user with admin rights.',
                                    epilog='Example of use: \n'
                                               + '  python '+os.path.basename(__file__)+' --url https://chaimeleon-eu.i3m.upv.es/guacamole/ --admin-user admin '
                                               + '--user user1 --password somePassword --debug')
    parser.add_argument('--url', type=str, required=True, help='Guacamole endpoint URL. Example: https://chaimeleon-eu.i3m.upv.es/guacamole/')
    parser.add_argument('--admin-user', type=str, required=True, help='User for the Guacamole API-REST endpoint login')
    parser.add_argument('--admin-password', type=str, default='..........', help='Password for the Guacamole API-REST endpoint login (you should have a user in guacamole database with a not empty password). ' 
                                                                               + 'May be you can access to Guacamole web page using an OIDC account, in that case the password probably is not the same. '
                                                                               + '(if --admin-password is not set, it will be interactively asked)')
    parser.add_argument('--user', type=str, required=True, help='User name to create')
    parser.add_argument('--password', type=str, default='..........', help='Password for the user to create. '
                                                                         + '(if --password is not set, it will be interactively asked)')
    parser.add_argument('--debug', action='store_true', help='Write debug details in the standard output')
    args = parser.parse_args()
    DEBUG = args.debug
    
    url = urllib.parse.urlparse(args.url)
    port = url.port
    if url.scheme == 'http':
        if port == None: port = 80
        connection = http.client.HTTPConnection(url.hostname, port) 
    else:
        if port == None: port = 443
        connection = http.client.HTTPSConnection(url.hostname, port)

    admin_password = args.admin_password
    if admin_password == '..........':
        admin_password = getpass("Password for "+args.admin_user+ " in Guacamole: ")

    password = args.password
    if password == '..........':
        password = getpass("Password for "+args.user+ " in Guacamole: ")

    print('Connecting to '+args.url+ 'api/')
    token = guacamole_login(connection, url.path, args.admin_user, admin_password)
    if token=='': exit(code=1)

    ret = existsUser(connection, url.path, token, args.user)
    if ret==-1: exit(code=2)
    if ret: 
        print('The user '+args.user+' already exists. Changing the password')
        ret = changePasswordToUser(connection, url.path, token, args.user, password)
        if ret==False: exit(code=2)
    else:
        print('Creating user: '+args.user)
        ret = createUser(connection, url.path, token, args.user, password)
        if ret==False: exit(code=2)

    print('Adding permission to create connections')
    ret = changePermissionToUser(connection, url.path, token, args.user, 'add', 'CREATE_CONNECTION')
    if ret==False: exit(code=3)

    ret = existsConnectionGroup(connection, url.path, token, args.user)
    if ret==-1: exit(code=4)
    if ret: print('The connection group for the user already exists.')
    else:
        #NOTE: The connection group must be created by the user because only the creator (or an admin) can create connections in the group. 
        #      If a connection group is created by an admin, only admins can create connections in it.

        print('Adding permission to create connection groups to the user')
        ret = changePermissionToUser(connection, url.path, token, args.user, 'add', 'CREATE_CONNECTION_GROUP')
        if ret==False: exit(code=4)

        print('Login with the user')
        user_token = guacamole_login(connection, url.path, args.user, password)
        if user_token=='': exit(code=5)

        print('Creating connection group')
        ret = createConnectionGroup(connection, url.path, user_token, args.user)
        if ret==False: exit(code=6)

        print('Removing permission to create connection groups')
        ret = changePermissionToUser(connection, url.path, token, args.user, 'remove', 'CREATE_CONNECTION_GROUP')
        if ret==False: exit(code=4)
                
    print('Done.')
    exit(code=0)

