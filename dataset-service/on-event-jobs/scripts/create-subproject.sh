#!/bin/bash 

# Echo all commands before execute
#set -x
# Interrupt and exit on any error
set -e

# Environmental variables required:
#   PROJECT_CODE
#   SUBPROJECT_CODE
#   SUBPROJECT_NAME
#   SUBPROJECT_DESCRIPTION
#   SUBPROJECT_EXTERNAL_ID

#   KEYCLOAK_TOKEN_ENDPOINT
#   QPI_ADMIN_USERNAME
#   QPI_ADMIN_PASSWORD

#   QPI_ADMIN_ENDPOINT
#   QPI_ADMIN_CLIENT_ID

#   DS_ENDPOINT
#   DS_CLIENT_ID

echo "$(date -Iseconds) - Running scripts to create the subproject '${PROJECT_CODE}|${SUBPROJECT_CODE}'."
echo "SUBPROJECT_NAME='${SUBPROJECT_NAME}'"
echo "SUBPROJECT_DESCRIPTION='${SUBPROJECT_DESCRIPTION}'"
echo "SUBPROJECT_EXTERNAL_ID=${SUBPROJECT_EXTERNAL_ID}"

echo "=============== Create the project in QP-Insights"
python3 manage_qpinsights_project.py "${KEYCLOAK_TOKEN_ENDPOINT}" ${QPI_ADMIN_USERNAME} ${QPI_ADMIN_PASSWORD}  \
                                     "${QPI_ADMIN_ENDPOINT}" ${QPI_ADMIN_CLIENT_ID} \
                                     "${DS_ENDPOINT}" ${DS_CLIENT_ID} \
                                     create "${PROJECT_CODE}" "${SUBPROJECT_CODE}" "${SUBPROJECT_NAME}" \
                                     "${SUBPROJECT_DESCRIPTION}" "${SUBPROJECT_EXTERNAL_ID}"

echo "End of scripts to create the subproject."
