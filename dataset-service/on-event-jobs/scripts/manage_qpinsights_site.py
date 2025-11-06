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
    parser.add_argument(metavar="<AUTH CLIENT ID>", dest="auth_client_id", help="Client id to authenticate")
    parser.add_argument(metavar="<AUTH USERNAME>", dest="auth_username", help="Username to authenticate")
    parser.add_argument(metavar="<AUTH PASSWORD>", dest="auth_password", help="Password to authenticate")
    parser.add_argument(metavar="<QPINSIGHTS ADMIN API ENDPOINT>", dest="qpi_admin_api_endpoint", help="QPInsights Admin API endpoint")
    parser.add_argument(metavar="<OPERATION>", dest="operation", help="create (currently there is only that operation)")
    parser.add_argument(metavar="<SITE CODE>", dest="site_code", help="The code of the site")
    parser.add_argument(metavar="<SITE NAME>", dest="site_name", help="The name of the site")
    parser.add_argument(metavar="<SITE COUNTRY>", dest="site_country", help="The country where is the site")
    parser.add_argument(metavar="<SITE REPRESENTATIVE NAME>", dest="site_representative_name", help="The name of representative person of the site")
    parser.add_argument(metavar="<SITE REPRESENTATIVE EMAIL>", dest="site_representative_email", help="The email of representative person of the site")

    args = parser.parse_args()
    auth_endpoint = args.auth_endpoint
    auth_client_id = args.auth_client_id
    auth_username = args.auth_username
    auth_password = args.auth_password
    qpi_admin_api_endpoint = args.qpi_admin_api_endpoint
    operation = args.operation
    site_code = args.site_code
    site_name = args.site_name
    site_country = args.site_country
    site_representative_name = args.site_representative_name
    site_representative_email = args.site_representative_email

    print("#### %s -- %s -- %s" %(site_code, site_name, site_country))
    AUTH_CLIENT = AuthClient(auth_endpoint, auth_client_id, login_as_service_account=False, username=auth_username, password=auth_password)
    QPI_ADMIN_CLIENT = QPInsightsAdminAPIClient(AUTH_CLIENT, qpi_admin_api_endpoint)
    if site_representative_name == '': site_representative_name = '-'
    if site_representative_email == '': site_representative_email = 'quibim@quibim.com'
    site_code = QPI_ADMIN_CLIENT.createOrUpdateSite(site_code, site_name, site_country, 
                                                    site_representative_name, site_representative_email, "000000000")
    print("Done")

