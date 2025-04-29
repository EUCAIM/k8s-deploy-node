<#import "template.ftl" as layout>
<#import "buttons.ftl" as buttons>

<@layout.registrationLayout displayMessage=false; section>
<!-- template: terms.ftl -->

    <#if section = "header">
        ${msg("termsTitle")}
    <#elseif section = "form">
    <script type="text/javascript"> 
        function ready(fn) {
            if (document.readyState !== 'loading') fn();
            else document.addEventListener('DOMContentLoaded', fn);
        }
        function changeLinkToOpenExtern(link){
            link.addEventListener("click", function(e) {
                e.preventDefault();
                window.open(e.currentTarget.getAttribute("href"), "", "width=1200,height=800");
                return false;
            });
        }
        ready(function(){
            document.querySelectorAll("a.link-to-document").forEach(link => { changeLinkToOpenExtern(link) });
        });
    </script>
    <div class="${properties.kcContentWrapperClass}">
        ${kcSanitize(msg("termsText"))?no_esc}
    </div>
    <form class="${properties.kcFormClass!}" action="${url.loginAction}" method="POST">
        <@buttons.actionGroup horizontal=true>
            <@buttons.button name="accept" id="kc-accept" label="doAccept" class=["kcButtonPrimaryClass"]/>
            <@buttons.button name="cancel" id="kc-decline" label="doDecline" class=["kcButtonSecondaryClass"]/>
        </@buttons.actionGroup>
    </form>
    <div class="clearfix"></div>
    </#if>
</@layout.registrationLayout>
