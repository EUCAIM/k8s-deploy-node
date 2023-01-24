
function rolesArrayToCheckBoxes(rolesArray) {
    for (let i = 0; i < rolesArray.length; i++) {
        //$("#role_" + rolesArray[i]).checked = true;
        $("input[type='checkbox'][id=role_"+ rolesArray[i] +"]")[0].checked = true;
    }
}

function checkBoxesToRolesArray() {
    rolesArray = [];
    //let checkboxes = document.querySelectorAll("input[type='checkbox'][id^=role_]");
    let checkboxes = $("input[type='checkbox'][id^=role_]");
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked)
            rolesArray.push(checkboxes[i].id.substr(5));
    }
    return rolesArray;
}


function isSafeUsername(txt) {
    if (txt.length < 3) {
        alert("Sorry, the username must be 3 or more characters");
        return false;
    }
    if (txt.length > 24) {
        alert("Sorry, the username must be up to 24 characters");
        return false;
    }
    if (!txt.match(/^[0-9a-z-]+$/)) {
        alert("Sorry, the username must contain only lowercase alphanumeric characters or '-'. \nExamples: james, james-upv, james31");
        return false;
    }
    if (txt[0] == '-' || txt[txt.length-1] == '-') {
        alert("Sorry, the username can't start nor end with '-'");
        return false;
    }
    return true;
}
