#! /usr/bin/env python3

import argparse
import logging
import sys
from auth import AuthClient
from qpinsights_admin_api import QPInsightsAdminAPIClient

if __name__ == '__main__':
    logging.root.setLevel(logging.DEBUG)
    stdout_handler = logging.StreamHandler(sys.stdout)
    logging.root.addHandler(stdout_handler)

    parser = argparse.ArgumentParser()
    parser.add_argument(metavar="<AUTH ENDPOINT>", dest="auth_endpoint", help="Authentication endpoint to access to the QPInsights Admin API")
    parser.add_argument(metavar="<AUTH CLIENT ID>", dest="auth_client_id", help="Client id to authenticate as a service account to access to the QPInsights Admin API")
    parser.add_argument(metavar="<AUTH USERNAME>", dest="auth_username", help="Username to authenticate to access to the QPInsights Admin API")
    parser.add_argument(metavar="<AUTH PASSWORD>", dest="auth_password", help="Password to authenticate to access to the QPInsights Admin API")
    parser.add_argument(metavar="<QPINSIGHTS ADMIN API ENDPOINT>", dest="qpi_admin_api_endpoint", help="QPInsights Admin API endpoint")
    parser.add_argument(metavar="<OPERATION>", dest="operation", help="create or disable (take out from all projects)")
    parser.add_argument(metavar="<USER EMAIL>", dest="user_email", help="The email of the user to create or disable")
    parser.add_argument(metavar="<USER NAME>", dest="user_name", help="The complete name of the user to create")
    parser.add_argument(metavar="<USER SITE CODE>", dest="user_site_code", help="The code of site of the user")
    #parser.add_argument(metavar="<USER SITE NAME>", dest="user_site_name", help="The name of site of the user")
    #parser.add_argument(metavar="<USER SITE COUNTRY>", dest="user_site_country", help="The country of site of the user")
    #parser.add_argument(metavar="<USER SITE REPRESENTATIVE NAME>", dest="user_site_representative_name", help="The name of representative of site of the user")
    #parser.add_argument(metavar="<USER SITE REPRESENTATIVE EMAIL>", dest="user_site_representative_email", help="The email of representative of site of the user")
    parser.add_argument(metavar="<USER POSITION>", dest="user_position", help="The position of the user in the site")
    parser.add_argument(metavar="<USER PROJECTS CODES>", dest="user_projects_codes", help="A list of project codes separated by ':' which the user has to be assigned to")

    args = parser.parse_args()
    auth_endpoint = args.auth_endpoint
    auth_client_id = args.auth_client_id
    auth_username = args.auth_username
    auth_password = args.auth_password
    qpi_admin_api_endpoint = args.qpi_admin_api_endpoint
    operation = args.operation
    user_email = args.user_email
    user_name = args.user_name
    user_site_code = args.user_site_code
    #user_site_name = args.user_site_name
    #user_site_country = args.user_site_country
    #user_site_representative_name = args.user_site_representative_name
    #user_site_representative_email = args.user_site_representative_email
    user_position = args.user_position
    user_projects_codes = str(args.user_projects_codes).split(":")

    AUTH_CLIENT = AuthClient(auth_endpoint, auth_client_id, login_as_service_account=False, username=auth_username, password=auth_password)
    QPI_ADMIN_CLIENT = QPInsightsAdminAPIClient(AUTH_CLIENT, qpi_admin_api_endpoint)
    # site_code = QPI_ADMIN_CLIENT.createOrUpdateSite(user_site_code, user_site_name, user_site_country, 
    #                                                 user_site_representative_name, user_site_representative_email, "000000000")
    site_id_to_assign = QPI_ADMIN_CLIENT.getSiteId(user_site_code)
    if site_id_to_assign is None:
        print("Error: the site code '%s' does not exist." % user_site_code)
    subprojects_ids_to_assign = QPI_ADMIN_CLIENT.getProjectsIds(user_projects_codes)

    QPI_ADMIN_CLIENT.createOrUpdateUser(user_email, user_name, site_id_to_assign, user_position, subprojects_ids_to_assign)
    print("Done")


