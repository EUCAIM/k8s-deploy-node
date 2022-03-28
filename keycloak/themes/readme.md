Some tunings for the CHAIMELEON project: CSS styles, logos and fields added in forms.
Copy the _chaimeleon_ directory into the _themes_ directory of the keycloak directory, by default: ``/opt/jboss/keycloak/themes/``.

Doc:
https://www.keycloak.org/docs/latest/server_development/#_custom_user_attributes

Note:
*.base.ftl files are not functional just included to identify changes from the base version with a diff. 
Useful when upgrading to a new version of Keycloak, to merge those changes if the files are changed also in the new version.

Develop:
Keycloak use PatternFly for the design: https://pf4.patternfly.org/guidelines/
To test locally some change to the theme you can launch a container with: 
    docker run -d --name keycloak -p 10001:8080 -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=secret ^
    --mount type=bind,source=C:\proyectos\k8s\CHAIMELEON\k8s-deployments\keycloak\themes\chaimeleon,target=/opt/jboss/keycloak/themes/chaimeleon ^
    quay.io/keycloak/keycloak:13.0.1
Then put in the browser:
    http://localhost:10001/auth
    http://localhost:10001/auth/realms/master/account

