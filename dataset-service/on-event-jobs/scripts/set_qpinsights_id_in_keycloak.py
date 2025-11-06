#! /usr/bin/env python3

import argparse
import json
import secrets, string
import base64
from auth import AuthClient
from keycloak_admin_api import KeycloakAdminAPIClient

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(metavar="<AUTH ENDPOINT>", dest="auth_endpoint", help="Authentication endpoint to access to the Keycloak Admin API")
    parser.add_argument(metavar="<AUTH CLIENT ID>", dest="auth_client_id", help="Client id to authenticate as a service account to access to the Keycloak Admin API")
    parser.add_argument(metavar="<AUTH CLIENT SECRET>", dest="auth_client_secret", help="Client secret to authenticate as a service account to access to the Keycloak Admin API")
    parser.add_argument(metavar="<KEYCLOAK ADMIN API ENDPOINT>", dest="keycloak_admin_api_endpoint", help="Keycloak Admin API endpoint")
    parser.add_argument(metavar="<USERNAME>", dest="username", help="Username")
    parser.add_argument(metavar="<ATTRIBUTE NAME>", dest="attribute_name", help="Attribute name to set for the user with the id")

    args = parser.parse_args()
    auth_endpoint = args.auth_endpoint
    auth_client_id = args.auth_client_id
    auth_client_secret = args.auth_client_secret
    keycloak_admin_api_endpoint = args.keycloak_admin_api_endpoint
    username = args.username
    attribute_name = args.attribute_name

    AUTH_CLIENT = AuthClient(auth_endpoint, auth_client_id, login_as_service_account=True, client_secret=auth_client_secret)
    AUTH_ADMIN_CLIENT = KeycloakAdminAPIClient(AUTH_CLIENT, keycloak_admin_api_endpoint)
    userId = AUTH_ADMIN_CLIENT.getUserId(username)
    qpi_id = AUTH_ADMIN_CLIENT.getUserAttribute(userId, attribute_name)
    if qpi_id is None:
        # If the attribute does not exist yet, set it taking the current email
        qpi_id = AUTH_ADMIN_CLIENT.getUserEmail(userId)
        AUTH_ADMIN_CLIENT.setUserAttribute(userId, attribute_name, qpi_id)
    print(qpi_id)

