function showButtonDropdown(e) {
    var thisDropdownSelector = ".dropdown-menu[aria-labelledby='" + e.target.id + "']";
    toggleVisibility(thisDropdownSelector);
    one(function (e) {
        var isTouchStart = e.type === "touchstart";
        var isMenuItem = e.target.closest(".navbar") !== null;

        if(!(isTouchStart && isMenuItem)) {
            setVisibility(thisDropdownSelector, false);
        }
        /*else {
            // this is for older ios (at least)
            // clicking off the menu wouldnt fire the click event
            // touchstart event got added but touchstart wants
            // to hide it immediately which doesn't work
            // it should start navigating and you shouldn't have to worry about hiding it anyways
        }*/
    });
    e.stopPropagation();

    // if another dropdown is already open make sure to close it.
    var openDropdownSelector = ".dropdown-menu[data-showing='true']:not([aria-labelledby='" + e.target.id + "'])";
    toggleVisibility(openDropdownSelector);
}

onClick(document.getElementById("glossaryDropdown"), showButtonDropdown);
onClick(document.getElementById("appendixDropdown"), showButtonDropdown);