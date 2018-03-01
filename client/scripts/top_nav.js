function showButtonDropdown(dropdown) {
    // show the dropdown
    var thisDropdownSelector = ".dropdown-menu[aria-labelledby='" + dropdown.id + "']";
    toggleVisibility(thisDropdownSelector);

    // if another dropdown is already open make sure to close it.
    var openDropdownSelector = ".dropdown-menu[data-showing='true']:not([aria-labelledby='" + dropdown.id + "'])";
    toggleVisibility(openDropdownSelector);
}

function hideButtonDropdown() {
    var openDropdowns = document.querySelectorAll(".dropdown-menu[data-showing='true']");
    for(var i = 0; i < openDropdowns.length; i++) {
        var dropdown = openDropdowns[i];
        setVisibility(dropdown, false);
    }
}

function toggleButtonDropdown(e) {
    var clickedDropdown = e.target.id === "glossaryDropdown" || e.target.id === "appendixDropdown";
    if(clickedDropdown) {
        showButtonDropdown(e.target);
    }
    else {
        if(e.target.tagName.toLowerCase() !== "a") {
            hideButtonDropdown();
        }
    }
}
onClick(window, toggleButtonDropdown);