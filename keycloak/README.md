# Configurations in the recipes:

## __dep2_database.yaml:__
```
cp dep2_database.yaml dep2_database.private.yaml
vim dep2_database.private.yaml
```
- Set the ``POSTGRES_PASSWORD``: _XXXXXXXXXX_. The password for the user in the database.

## __dep3_keycloak_v4.yaml:__
```
cp dep3_keycloak_v4.yaml dep3_keycloak_v4.private.yaml
vim dep3_keycloak_v4.private.yaml
```
- Set the ``KC_BOOTSTRAP_ADMIN_USERNAME``: _admin_. The name of the admin user.
- Set the ``KC_BOOTSTRAP_ADMIN_PASSWORD``: _XXXXXXXXXXXX_. The password of the admin user.
- Set the ``KC_DB_PASSWORD``: _XXXXXXXXXX_. The password of the user in the database (same as the one set in __dep2_database.private.yaml__).
- Set the ``KC_SPI_EVENTS_LISTENER_EMAIL_TO_ADMIN_EMAIL_RECEIVERS``: _admin@example.com_. A coma-separated list of admins email addresses to notify new users registrations.

## __dep4_ingress.yaml:__
- Set the ``host``: _eucaim-node.i3m.upv.es_. The domain name of the host.
- Set the ``path``: _auth_. The path to access to that service in the host.


# Deployment

First, you must create the namespace for the deployment with: `kubectl create namespace keycloak`

Then, it is required to create the persistent volume claims (PVC). 
There will be one for the database and others for themes and customizations of the main service. 
```console
kubectl apply -f dep0_volumes.yaml
```
Only in old version of Kubernetes you must launch a pod to initialize the permissions of the volumes:
```console
kubectl apply -f dep1_init_volumes.yaml
```

Once created the volume for themes (named _themes-data_), you must copy the contents of _themes_ directory into it. 
```console
cp -r themes/* /mnt/cephfs/k8s/volumes/csi/csi-vol-b4e7ede0-8f9b-4f53-b441-1db2823c748b/9c5a23bd-8fcc-485d-a42c-4624ce3d4a94/
```
It contains a directory named _eucaim-node_. 
That directory will be mounted on _themes_ directory of the keycloak working directory in the main service container, by default: ``/opt/keycloak/themes``.
The result in the container should be like that:
```console
bash-4.4$ ls /opt/keycloak/themes/
eucaim-node/    README.txt
```

Also copy the [custom extensions](https://github.com/orgs/chaimeleon-eu/repositories?q=keycloak) to the PVC  ``standalone-deployments``.  
Current download links (2025-04-29):
```
# https://github.com/chaimeleon-eu/keycloak-event-listener-email-to-admin/releases/latest
wget "https://github.com/chaimeleon-eu/keycloak-event-listener-email-to-admin/releases/download/v1.0.6/keycloak-event-listener-email-to-admin-1.0.6.jar"
# https://github.com/chaimeleon-eu/keycloak-required-action-user-validated/releases/latest
wget "https://github.com/chaimeleon-eu/keycloak-required-action-user-validated/releases/download/v1.0.5/keycloak-required-action-user-validated-1.0.5.jar"

```
This files will be mounted on _providers_ directory of the keycloak working directory in the main service container, by default: ``/opt/keycloak/providers``. 
The result in the container should be like that:
```console
bash-4.4$ ls /opt/keycloak/providers/
keycloak-event-listener-email-to-admin-1.0.6.jar
keycloak-required-action-user-validated-1.0.5.jar
```
Now, you are able to deploy the database:
```console
kubectl apply -f dep2_database.private.yaml
```
Once the database is running, you can deploy the main service:
```console
kubectl apply -f dep3_keycloak_v4.private.yaml
```
And finally you can create an ingress to access the main service:
```console
kubectl apply -f dep4_ingress.yaml
```
As soon as Keycloak is running, the Keycloak Admin Console should be available at: https://eucaim-node.i3m.upv.es/auth
 
And when EUCAIM-NODE realm is created...
 - Keycloak User Account Console at https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/account
 - Discovery endpoint (useful to configure clients) at https://eucaim-node.i3m.upv.es/auth/realms/EUCAIM-NODE/.well-known/openid-configuration

# Other configurations
Create the realm `EUCAIM-NODE`...

Create the roles...

Create the groups for roles and for projects.

Go to Client scopes and create one with:
  Name: `groups`
  Type: `None`
  Display on consent screen: `false`
  Include in token scope: `true`
And in "Mappers" tab add one "by configuration", select "Group Membership" and:
  Name: `groups`
  Token Claim Name: `groups`
  Full group path: `false`
  Add to ID token: `true`
  Add to access token: `true`
  Add to lightweight access token: `false`
  Add to userinfo: `true`
  Add to token introspection: `true`


## CHAIMELEON EGI Check-in

Client Management URL (Dev): https://aai-dev.egi.eu/federation/egi/home


## Control to allow only validated users login
The registration (or access with external IDP) is free, there is no control by default in Keycloak, 
but a new user obviously should not be able to use the services until validated and assigned to any general role and project.
As that new user doesn't have permissions, the web pages of different services/applications will appear empty 
or will show an error message like "missing permissions" or similar, which can be confusing to the user.
So, to properly inform the user that the account is pending for validation, 
we are going to add an access control in the login flows to detect that case and show a custom error message. 

First, let's create two special realm roles: 
 - One with the name "validated_user" (any user without it will get an error message like "account pending for validation").
 - And one with the name "rejected_user" (any user with it will get an error message like "account rejected").
The validator will be able to assign them to the users whenever they are validated or rejected, 
but in order to make the task easier, assign the role "validated_user" to all the general role groups, 
so that way the validator just will have to assign the user to any general role group and the role will be inherited.
Also create a special group named "rejected-user", and assign the role "rejected_user" to it,
so that way the validator just will have to assign groups to users in order to validate or reject.

Finally, go to main menu "Authentication", then to the tab "Required actions" and enable the one named "User must be validated",
and set it as default action.  
Note that required action is provided by the custom extension `keycloak-required-action-user-validated-X.X.X.jar`, 
if it's missing see the previous section [Deployment](#deployment).

The required action is a step required in any login request which will check if the user has the validated role or even the requejected role,
showing the appropiate message on each case.
It can be configured with the environment variables starting with "KC_SPI_REQUIRED_ACTION_USER_VALIDATED_" in `dep3_keycloak_v4.private.yaml`.

There is an alternative mode to do this control of validated users which is the previously used solution: 
[old/control_validated_users.md](/old/control_validated_users.md)  
It was based in the keycloak configurable flows, but it is more tedious to configure and it is not a complete solution: 

## Send notifications to the admins by e-mail
If you installed the custom extension `keycloak-event-listener-email-to-admin-X.X.X.jar`, 
then you will see the new Event Listener "email-to-admin" in the menu "Realm settings", tab "Events", subtab "Event listeners". 
You shoud "Enable" it just adding to the list of event listeners.

To configure email receivers see the environment variable `KC_SPI_EVENTS_LISTENER_EMAIL_TO_ADMIN_EMAIL_RECEIVERS` in the file `dep3_keycloak_v4.private.yaml`.


---
Privacy Policy: 
Terms of Use: 