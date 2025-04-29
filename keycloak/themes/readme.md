Some tunings for the EUCAIM-NODE project: CSS styles, logos and fields added in forms.
Copy the _eucaim-node_ directory into the _themes_ directory of the keycloak directory, by default: ``/opt/keycloak/themes/``.

Doc:
https://www.keycloak.org/docs/latest/server_development/#_custom_user_attributes
Example of custom account console with react (based on theme keycloak.v2):
https://github.com/keycloak/keycloak-quickstarts/tree/latest/extend-account-console

Note:
*.base.ftl files are not functional just included to identify changes from the base version with a diff. 
Useful when upgrading to a new version of Keycloak, to merge those changes if the files are changed also in the new version.

Develop:
Keycloak use PatternFly for the design: https://pf4.patternfly.org/guidelines/
To test locally some change to the theme you can launch a container with: 
    docker run -d --name keycloak -p 10001:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=secret ^
               --mount type=bind,source=C:\proyectos\k8s\EUCAIM\k8s-deploy-node\keycloak\themes\eucaim-node,target=/opt/keycloak/themes/eucaim-node ^
               quay.io/keycloak/keycloak:26.2.0 start-dev
Then put in the browser:
    http://localhost:10001/
    http://localhost:10001/realms/master/account
