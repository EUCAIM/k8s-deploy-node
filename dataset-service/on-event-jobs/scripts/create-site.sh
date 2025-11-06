#!/bin/bash 

# Echo all commands before execute
#set -x
# Interrupt and exit on any error
set -e

# Environmental variables required:
#   SITE_CODE
#   SITE_NAME
#   SITE_COUNTRY
#   SITE_CONTACT_PERSON_NAME
#   SITE_CONTACT_PERSON_EMAIL

#   KEYCLOAK_TOKEN_ENDPOINT

#   QPI_ADMIN_ENDPOINT
#   QPI_ADMIN_CLIENT_ID
#   QPI_ADMIN_USERNAME
#   QPI_ADMIN_PASSWORD


echo "$(date -Iseconds) - Running scripts to create the site '${SITE_CODE}'."
echo "SITE_NAME=${SITE_NAME}"
echo "SITE_COUNTRY=${SITE_COUNTRY}"
echo "SITE_CONTACT_PERSON_NAME=${SITE_CONTACT_PERSON_NAME}"
echo "SITE_CONTACT_PERSON_EMAIL=${SITE_CONTACT_PERSON_EMAIL}"

echo "=============== Create the site in QP-Insights"
python3 manage_qpinsights_site.py "${KEYCLOAK_TOKEN_ENDPOINT}" ${QPI_ADMIN_CLIENT_ID} ${QPI_ADMIN_USERNAME} ${QPI_ADMIN_PASSWORD}  \
                                  "${QPI_ADMIN_ENDPOINT}" create "${SITE_CODE}" "${SITE_NAME}" "${SITE_COUNTRY}" \
                                  "${SITE_CONTACT_PERSON_NAME}" "${SITE_CONTACT_PERSON_EMAIL}"

echo "End of scripts to create the site."
