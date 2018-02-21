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
onClick(window, function(e) {
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
onClick(window, function(e) {
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
        var messingWithText = /\bcheat-text\b/.test(e.target.className);
        if(!messingWithText) {
            forEachElement(".cheat-container", function(cheatContainer) {
                cheatContainer.className = cheatContainer.className.replace(/\bon\b/g, "");
            });   
        }
    }
});

