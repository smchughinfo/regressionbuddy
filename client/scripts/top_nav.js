function showButtonDropdown(e) {
    var thisDropdownSelector = ".dropdown-menu[aria-labelledby='" + e.target.id + "']";
    toggleVisibility(thisDropdownSelector);
    one(function () {
        setVisibility(thisDropdownSelector, false);
    });
    e.stopPropagation();

    // if another dropdown is already open make sure to close it.
    var openDropdownSelector = ".dropdown-menu[data-showing='true']:not([aria-labelledby='" + e.target.id + "'])";
    toggleVisibility(openDropdownSelector);
}

onClick(document.getElementById("glossaryDropdown"), showButtonDropdown);
onClick(document.getElementById("appendixDropdown"), showButtonDropdown);