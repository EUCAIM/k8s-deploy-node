
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

