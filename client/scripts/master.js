function switchComponent(e) {
    var toCompontent = e.target.href.split("#").pop();

    forEachElement("#componentLinksContainer > li > a", function (a) {
        a.className = a.className.replace(/\bactive\b/g, "");
    });
    e.target.className += " active";

    forEachElement("#componentsContainer > div", function (div) {
        div.setAttribute("data-showing", "false");
    });
    document.querySelector("#" + toCompontent).setAttribute("data-showing", "true");

    clearHash();
    e.preventDefault();
}
forEachElement("#componentLinksContainer > li > a", function (link) {
    link.addEventListener("click", switchComponent)
});

function clearHash() {
    try {
        history.replaceState({}, document.title, window.location.pathname); // hash would only ever get used if a user didnt have javascript. in that case it's used to show hide problems, solutions, and work'
    }
    catch (ex) {
        window.location.hash = "";
    }
}

function setRandomLink() {
    var last = parseInt(document.body.getAttribute("data-last-post-number"), 10);
    var postNumber = getPostNumber();
    var subject = getSubject();

    // TODO: THIS WILL NOT WORK IF SUBJECTS CHANGE
    console.log("THIS WILL CHANGE IF SUBJECTS CHANGE");
    var random = getRandomInt(1, last, postNumber);
    forEachElement('[data-link-to="random"]', function (link) {
        link.href = "/" + random + "/" + subject;
    });
}
if (document.querySelector(".post-nav")) {
    setRandomLink();
}

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
document.getElementById("glossaryDropdown").addEventListener("click", showButtonDropdown);
document.getElementById("appendixDropdown").addEventListener("click", showButtonDropdown);

// redirect to normalized url
(function () {
    var a = document.createElement("a");
    a.href = window.location.href;
    if (a.pathname === "" || a.pathname === "/") {
        console.log("Changing title here. Trying to get it to show up right on google but still make sense to users");
        // TOOO: maybe - google "regression buddy" and site title is "Algebra: Week 2" except for the "index" page it should be more general
        // serve it with a general title and then change it here. hope that works.

        try {
            var postNumber = getPostNumber();
            var subject = getSubject();
            var redirectUrl = window.location.href + postNumber + "/" + subject;
            document.title = "Week " + postNumber + " - " + capatalizeFirstLetterOfEveryWord(subject);

            console.log("this needs to run before getting disqus comment count");
            history.replaceState(null, document.title, redirectUrl);
        }
        catch (ex) {
            window.location.href = redirectUrl;
        }
    }
})();

// lazy load images
window.addEventListener("load", function () {
    var loaded = false;
    function loadImages() {
        if (loaded) {
            return;
        }
        document.querySelectorAll("[data-src]").forEach(function (elm) {
            var src = elm.getAttribute("data-src");
            elm.removeAttribute("data-src");
            elm.setAttribute("src", src);
        });
        loaded = true;
    }
    MathJax.Hub.Queue(loadImages);
    setTimeout(loadImages, 2000);
});

// MATHJAX
MathJax.Hub.Config({
    CommonHTML: {
        linebreaks: { automatic: true }
    }
});
// RESIZE MATHJAX -- makes the page jump too much. can produce double output.
/*function resetMathJax() { 
    MathJax.Hub.Reprocess(document.body); 
}*/
//window.addEventListener('resize', debounce(resetMathJax, 1));

// IMAGE BIGGERER
window.addEventListener("click", function (e) {
    if (e.target.nodeName.toLowerCase() === "img") {
        var img = e.target;
        if (img.id !== "bigImage" && img.closest(".open-graph") === null) {
            var bigImage = document.getElementById("bigImage");
            var layover = document.querySelector(".layover");

            bigImage.src = img.src;
            layover.className = layover.className.replace(/\bhidden-layover\b/g, "");
            document.body.className += " blur";
            one(function () {
                layover.className += " hidden-layover";
                document.body.className = document.body.className.replace(/\bblur\b/g, "");
            });
        }
    }
});

/****** CHEAT CODE ******/
window.addEventListener("click", function(e) {
    var toggleCheat = /\bcheat-light\b/.test(e.target.className);
    if(toggleCheat) {
        var cheatLight = e.target;
        var cheatContainer = e.target.closest(".cheat-container")
        var cheatText= cheatContainer.querySelector("cheat-text");
        
        var on = /\bon\b/.test(cheatContainer.className);
        if(on) {
            cheatContainer.className = cheatContainer.className.replace(/\bon\b/g, "");
        }
        else {
            cheatContainer.className += " on";
        }
    }
    else {
        forEachElement(".cheat-container", function(cheatContainer) {
            cheatContainer.className = cheatContainer.className.replace(/\bon\b/g, "");
        });
    }
});