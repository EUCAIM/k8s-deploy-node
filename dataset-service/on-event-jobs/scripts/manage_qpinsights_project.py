#! /usr/bin/env python3

import argparse
import logging
import sys
from auth import AuthClient
from qpinsights_admin_api import QPInsightsAdminAPIClient
from dataset_service_api import DatasetServiceAPIClient

if __name__ == '__main__':
    logging.root.setLevel(logging.DEBUG)
    stdout_handler = logging.StreamHandler(sys.stdout)
    logging.root.addHandler(stdout_handler)

    parser = argparse.ArgumentParser()
    parser.add_argument(metavar="<AUTH ENDPOINT>", dest="auth_endpoint", help="Authentication endpoint to access to the QPInsights Admin API")
    parser.add_argument(metavar="<AUTH USERNAME>", dest="auth_username", help="Username to authenticate")
    parser.add_argument(metavar="<AUTH PASSWORD>", dest="auth_password", help="Password to authenticate")
    parser.add_argument(metavar="<QPINSIGHTS ADMIN API ENDPOINT>", dest="qpi_admin_api_endpoint", help="QPInsights Admin API endpoint")
    parser.add_argument(metavar="<QPINSIGHTS ADMIN API CLIENT ID>", dest="qpi_auth_client_id", help="Client id to authenticate for QPI")
    parser.add_argument(metavar="<DATASET SERVICE API ENDPOINT>", dest="ds_api_endpoint", help="Dataset-service API endpoint")
    parser.add_argument(metavar="<DATASET SERVICE API CLIENT ID>", dest="ds_auth_client_id", help="Client id to authenticate for DS")
    parser.add_argument(metavar="<OPERATION>", dest="operation", help="create (currently there is only that operation)")
    parser.add_argument(metavar="<PROJECT CODE>", dest="project_code", help="The code of the project")
    parser.add_argument(metavar="<SUBPROJECT CODE>", dest="subproject_code", help="The code of the subproject")
    parser.add_argument(metavar="<SUBPROJECT NAME>", dest="subproject_name", help="The name of the subproject")
    parser.add_argument(metavar="<SUBPROJECT DESCRIPTION>", dest="subproject_description", help="The description of the subproject")
    parser.add_argument(metavar="<SUBPROJECT EXTERNAL ID>", dest="subproject_external_id", help="The id of subproject in QPI")

    args = parser.parse_args()
    auth_endpoint = args.auth_endpoint
    auth_username = args.auth_username
    auth_password = args.auth_password
    qpi_admin_api_endpoint = args.qpi_admin_api_endpoint
    qpi_auth_client_id = args.qpi_auth_client_id
    ds_api_endpoint = args.ds_api_endpoint
    ds_auth_client_id = args.ds_auth_client_id
    operation = args.operation
    project_code = args.project_code
    subproject_code = args.subproject_code
    subproject_name = args.subproject_name
    subproject_description = args.subproject_description
    subproject_id = args.subproject_external_id

    print("#### %s -- %s -- %s -- %s -- %s" %(project_code, subproject_code, subproject_name, subproject_description, subproject_id))
    AUTH_CLIENT = AuthClient(auth_endpoint, qpi_auth_client_id, login_as_service_account=False, username=auth_username, password=auth_password)
    QPI_ADMIN_CLIENT = QPInsightsAdminAPIClient(AUTH_CLIENT, qpi_admin_api_endpoint)
    qpi_project_code = project_code
    qpi_project_name = subproject_name
    if subproject_code != project_code:
        qpi_project_code += ("|" + subproject_code)
        qpi_project_name = project_code + " - " + qpi_project_name
    new_project_id = QPI_ADMIN_CLIENT.createOrUpdateProject(qpi_project_code, qpi_project_name, subproject_description)

    if new_project_id != subproject_id:
        print("New project ID, putting in the Dataset-service...")
        AUTH_CLIENT = AuthClient(auth_endpoint, ds_auth_client_id, login_as_service_account=False, username=auth_username, password=auth_password)
        DS_CLIENT = DatasetServiceAPIClient(AUTH_CLIENT, ds_api_endpoint) 
        DS_CLIENT.createOrUpdateSubproject(project_code, subproject_code, subproject_name, subproject_description, new_project_id)

    print("Done")

