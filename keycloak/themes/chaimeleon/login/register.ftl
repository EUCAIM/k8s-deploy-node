<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','user.attributes.companyOrOrganization','username','password','password-confirm'); section>
    <#if section = "header">
        ${msg("registerTitle")}
    <#elseif section = "form">

        <script type="text/javascript">    
            $(document).ready(function() {
                var strVal = $("[id='user.attributes.requiredRoles']")[0].value;
                if (strVal && strVal != "")
                    rolesArrayToCheckBoxes(strVal.split(","));
                
                document.forms[0].onsubmit = function(){
                    if(!isSafeUsername($("input[id='username']")[0].value)) return false;
                    
                    rolesArray = checkBoxesToRolesArray();
                    $("[id='user.attributes.requiredRoles']")[0].value = rolesArray.join(",");
                }
                
                $("div.card-pf")[0].style.maxWidth = "900px";
                div = $("div#kc-form-options")[0];
                div.style.maxWidth = "500px";
                div.style.float = "none";
                div.style.margin = "20px auto 0px";
                div = $("div#kc-form-buttons")[0];
                div.style.maxWidth = "500px";
                div.style.float = "none";
                div.style.margin = "20px auto 0px";
            })
        </script>
    
        <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">
            <div style="display:inline-block">
                <div class="col-md-6" style="margin-bottom:15px">
                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcLabelWrapperClass!}">
                            <label for="firstName" class="${properties.kcLabelClass!}">${msg("firstName")}</label>
                        </div>
                        <div class="${properties.kcInputWrapperClass!}">
                            <input type="text" id="firstName" class="${properties.kcInputClass!}" name="firstName"
                                   value="${(register.formData.firstName!'')}"
                                   aria-invalid="<#if messagesPerField.existsError('firstName')>true</#if>"
                            />

                            <#if messagesPerField.existsError('firstName')>
                                <span id="input-error-firstname" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('firstName'))?no_esc}
                                </span>
                            </#if>
                        </div>
                    </div>

                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcLabelWrapperClass!}">
                            <label for="lastName" class="${properties.kcLabelClass!}">${msg("lastName")}</label>
                        </div>
                        <div class="${properties.kcInputWrapperClass!}">
                            <input type="text" id="lastName" class="${properties.kcInputClass!}" name="lastName"
                                   value="${(register.formData.lastName!'')}"
                                   aria-invalid="<#if messagesPerField.existsError('lastName')>true</#if>"
                            />

                            <#if messagesPerField.existsError('lastName')>
                                <span id="input-error-lastname" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('lastName'))?no_esc}
                                </span>
                            </#if>
                        </div>
                    </div>

                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcLabelWrapperClass!}">
                            <label for="email" class="${properties.kcLabelClass!}">${msg("email")}</label>
                        </div>
                        <div class="${properties.kcInputWrapperClass!}">
                            <input type="text" id="email" class="${properties.kcInputClass!}" name="email"
                                   value="${(register.formData.email!'')}" autocomplete="email"
                                   aria-invalid="<#if messagesPerField.existsError('email')>true</#if>"
                            />

                            <#if messagesPerField.existsError('email')>
                                <span id="input-error-email" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('email'))?no_esc}
                                </span>
                            </#if>
                        </div>
                    </div>

                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcLabelWrapperClass!}">
                            <label for="user.attributes.companyOrOrganization" class="${properties.kcLabelClass!}">${msg("user.attributes.companyOrOrganization")}</label>
                        </div>
                        <div class="${properties.kcInputWrapperClass!}">
                            <input type="text" id="user.attributes.companyOrOrganization" class="${properties.kcInputClass!}" name="user.attributes.companyOrOrganization"
                                   value="${(register.formData['user.attributes.companyOrOrganization']!'')}" 
                                   aria-invalid="<#if messagesPerField.existsError('user.attributes.companyOrOrganization')>true</#if>"
                            />

                            <#if messagesPerField.existsError('user.attributes.companyOrOrganization')>
                                <span id="input-error-user.attributes.companyOrOrganization" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('user.attributes.companyOrOrganization'))?no_esc}
                                </span>
                            </#if>
                        </div>
                    </div>

                    <#if !realm.registrationEmailAsUsername>
                        <div class="${properties.kcFormGroupClass!}">
                            <div class="${properties.kcLabelWrapperClass!}">
                                <label for="username" class="${properties.kcLabelClass!}">${msg("username")}</label>
                            </div>
                            <div class="${properties.kcInputWrapperClass!}">
                                <input type="text" id="username" class="${properties.kcInputClass!}" name="username"
                                       value="${(register.formData.username!'')}" autocomplete="username"
                                       aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                                />

                                <#if messagesPerField.existsError('username')>
                                    <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                        ${kcSanitize(messagesPerField.get('username'))?no_esc}
                                    </span>
                                </#if>
                            </div>
                        </div>
                    </#if>

                    <#if passwordRequired??>
                        <div class="${properties.kcFormGroupClass!}">
                            <div class="${properties.kcLabelWrapperClass!}">
                                <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
                            </div>
                            <div class="${properties.kcInputWrapperClass!}">
                                <input type="password" id="password" class="${properties.kcInputClass!}" name="password"
                                       autocomplete="new-password"
                                       aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
                                />

                                <#if messagesPerField.existsError('password')>
                                    <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                        ${kcSanitize(messagesPerField.get('password'))?no_esc}
                                    </span>
                                </#if>
                            </div>
                        </div>

                        <div class="${properties.kcFormGroupClass!}">
                            <div class="${properties.kcLabelWrapperClass!}">
                                <label for="password-confirm"
                                       class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label>
                            </div>
                            <div class="${properties.kcInputWrapperClass!}">
                                <input type="password" id="password-confirm" class="${properties.kcInputClass!}"
                                       name="password-confirm"
                                       aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                                />

                                <#if messagesPerField.existsError('password-confirm')>
                                    <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                        ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                                    </span>
                                </#if>
                            </div>
                        </div>
                    </#if>
                    
                    <#if recaptchaRequired??>
                        <div class="form-group">
                            <div class="${properties.kcInputWrapperClass!}">
                                <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                            </div>
                        </div>
                    </#if>
                </div>
                
                <div class="col-md-6">
                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcLabelWrapperClass!}">
                            <h3 style="margin-top: 0px">${msg("user.attributes.requiredRoles")}</h3>
                        </div>
                        
                        <ul style="list-style-type: none">
                        <#list properties.kcRolesFullList?split(' ') as role>
                            <li class="${properties.kcRoleCard!}">
                                <img class="${properties.kcRoleCardImage!}" src="${url.resourcesPath}/img/role-images/${role}.png">
                                <div class="${properties.kcRoleCardText!}">
                                    <input type="checkbox" name="role_${role}" id="role_${role}" class="${properties.kcRoleCardCheck!}"> 
                                    <label for="role_${role}" class="${properties.kcRoleCardCheckLabel!}"><b>${msg("role_"+role)}</b></label>
                                    <label for="role_${role}" class="${properties.kcRoleCardCheckLabel!}">${msg("role_"+role+"_description")}</label>
                                </div>
                            </li>
                        </#list>
                        </ul>
                        
                        <div class="${properties.kcInputWrapperClass!}">
                            <input type="hidden" id="user.attributes.requiredRoles" class="${properties.kcInputClass!}" name="user.attributes.requiredRoles"
                                   value="${(register.formData['user.attributes.requiredRoles']!'')}" 
                                   aria-invalid="<#if messagesPerField.existsError('user.attributes.requiredRoles')>true</#if>"
                            />

                            <#if messagesPerField.existsError('user.attributes.requiredRoles')>
                                <span id="input-error-user.attributes.requiredRoles" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('user.attributes.requiredRoles'))?no_esc}
                                </span>
                            </#if>
                        </div>
                    </div>
                </div>
            </div>

            <div class="${properties.kcFormGroupClass!}">
                <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
                    <div class="${properties.kcFormOptionsWrapperClass!}">
                        <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
                    </div>
                </div>

                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                    <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegister")}"/>
                </div>
            </div>
        </form>
    </#if>
</@layout.registrationLayout>
