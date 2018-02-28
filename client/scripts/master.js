/****** SET RANDOM LINK ******/
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
    console.log("TODO: UNSET: UNCOMMENT THIS WHEN FIRST POST IS OUT OF REVIEW.");
    //setRandomLink();
}

/****** LAZY LOAD IMAGES ******/
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

/****** MATHJAX ******/
MathJax.Hub.Config({
    CommonHTML: {
        linebreaks: { automatic: true }
    }
});

/****** IMAGE BIGGERER ******/
function HandleImageResize(e) {
    var img = e.target;
    if (img.id !== "bigImage" && img.closest(".open-graph") === null) {
        var bigImage = document.getElementById("bigImage");
        var layover = document.querySelector(".layover");

        bigImage.src = img.src;
        layover.className = layover.className.replace(/\bhidden-layover\b/g, "");
        document.body.className += " blur";

        e.stopImmediatePropagation();
        one(function () {
            layover.className += " hidden-layover";
            document.body.className = document.body.className.replace(/\bblur\b/g, "");
        });
    }
}
forEachElement("img", function(elm) {
    onClick(elm, HandleImageResize);
});

/****** CHEAT CODE ******/
function showCheat(e) {
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

    e.preventDefault();
    e.stopImmediatePropagation();
    one(function() {
        toggleCheat();
    });
}
function hideCheat(e) {
    var messingWithText = e && e.target && e.target.className && /\bcheat-text\b/.test(e.target.className);
    if(!messingWithText) {
        forEachElement(".cheat-container", function(cheatContainer) {
            cheatContainer.className = cheatContainer.className.replace(/\bon\b/g, "");
        });   
    }
}
function toggleCheat(e) {
    var toggleCheat =  e && e.target && e.target.className && /\bcheat-light\b/.test(e.target.className);
    if(toggleCheat) {
        showCheat(e);
    }
    else {
        hideCheat(e);
    }
}
forEachElement(".cheat-light", function(elm) {
    onClick(elm, toggleCheat);
});