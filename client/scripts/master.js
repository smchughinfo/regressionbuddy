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
    console.log("TODO: UNSET: UNCOMMENT THIS WHEN SECOND POST IS OUT OF REVIEW.");
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