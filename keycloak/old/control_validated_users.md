
## Control to allow only validated users login
The registration (or access with external IDP) is free, there is no control by default in Keycloak, 
but a new user obviously should not be able to use the services until validated and assigned to any general role and project.
As that new user doesn't have permissions, the web pages of different services/applications will appear empty 
or will show an error message like "missing permissions" or similar, which can be confusing to the user.
So, to properly inform the user that the account is pending for validation, 
we are going to add an access control in the login flows to detect that case and show a custom error message. 

First, let's create a special realm role with the name "validated_user". 
Any user without it will get an error message like "account pending for validation").

The validator will be able to assign it to the users whenever they are validated, 
but in order to make the task easier, assign the role "validated_user" to all the general role groups, 
so that way the validator just will have to assign the user to any general role group and the role will be inherited.

**Add control to the login with browser flow**  
Go to main menu "Authentication", tab "Flows" and duplicate the "browser" flow with: 
  Name: browser - only validated users
  Description: Browser based authentication with check for validated user
Enter in the new flow to edit.
Add a sub-flow with:
  Name: Check if user not validated
  Description: (empty)
  Flow type: Generic
Place the new sub-flow within the one named "Browser - only validated users forms (username, password, otp and other auth forms)",
at the level of one named "Username Password Form" and at the end of that level, and set it as Conditional.
In the new sub-flow add a condition - user role, set it as Required and configure with:
  Alias: If user has not the validated_user role
  User role: validated_user
  Negate output: True
In the sub-flow add a step - Deny access, set it as Required and configure with:
  Alias: Deny access with a message
  Error message: Your account is pending to be validated and asigned to a project to be able to access to the services. You will be notified when that occurs. 

Finally, in the "Action" menu of the flow, bind it with the type "Browser flow".

**Add control to the login with IDP flow**  
In case of a user selects an IDP to login, then the flow is different.
For that case we must create a new flow:
  Name: IDP post login
  Description: To be executed after login with an IDP
  Flow type: Basic flow
In the new flow add a sub-flow with:
  Name: Check if user not validated
  Description: (empty)
  Flow type: Generic
Set the sub-flow as Conditional.
In the sub-flow add a condition - user role, set it as Required and configure with:
  Alias: If user has not the validated_user role
  User role: validated_user
  Negate output: True
In the sub-flow add a step - Deny access, set it as Required and configure with:
  Alias: Deny access with a message
  Error message: Your account is pending to be validated and asigned to a project to be able to access to the services. You will be notified when that occurs. 
Now in the main flow add a second sub-flow with:
  Name: Check if user is validated
  Description: (empty)
  Flow type: Generic
Set the sub-flow as Conditional.
In the sub-flow add a condition - user role, set it as Required and configure with:
  Alias: If user has the validated_user role
  User role: validated_user
  Negate output: False
In the sub-flow add a step - Allow access and set it as Required.

Now, to bind the flow, we must go to the main menu "Identity providers" and, for each of the IdProviders, 
go to "Advanced settings" and set the "Post login flow" to the previously created "IDP post login". 

**Add control to the login with direct grant flow**  
Finally there is the case when a user logins with direct access grant 
(with a client which doesn't support for redirect and so manages directly the user credentials, for example with curl).
For that case the process is similar to the "browser" flow but now with the "direct grant" flow.
Duplicate the "direct grant" flow with: 
  Name: direct grant - only validated users
  Description: Direct grant based authentication with check for validated user
Enter in the new flow to edit.
Add a sub-flow at the end with:
  Name: Check if user not validated
  Description: (empty)
  Flow type: Generic
Set the new sub-flow as Conditional.
In the new sub-flow add a condition - user role, set it as Required and configure with:
  Alias: If user has not the validated_user role
  User role: validated_user
  Negate output: True
In the sub-flow add a step - Deny access, set it as Required and configure with:
  Alias: Deny access with a message
  Error message: Your account is pending to be validated and asigned to a project to be able to access to the services. You will be notified when that occurs. 

Finally, in the "Action" menu of the flow, bind it with the type "Direct grant flow".
