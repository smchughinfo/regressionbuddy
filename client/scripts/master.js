function switchComponent(e) {
    var toCompontent = e.target.href.split("#").pop();
    
    forEachElement("#componentLinksContainer > li > a", function(a) {
        a.classList.remove("active")
    });
    e.target.classList.add("active");

    forEachElement("#componentsContainer > div", function(div) {
        div.setAttribute("data-showing", "false");
    });
    document.querySelector("#" + toCompontent).setAttribute("data-showing", "true");

    history.replaceState({}, document.title, window.location.pathname); // hash would only ever get used if a user didnt have javascript. in that case it's used to show hide problems, solutions, and work'
    e.preventDefault();
}
forEachElement("#componentLinksContainer > li > a", function(link) {
    link.addEventListener("click", switchComponent)
});

function setRandomLink() {
    var last = parseInt(document.body.getAttribute("data-last-post-number"), 10);
    var postNumber = getPostNumber();
    var subject = getSubject();

    // TODO: THIS WILL NOT WORK IF SUBJECTS CHANGE
    console.log("THIS WILL CHANGE IF SUBJECTS CHANGE");
    var random = getRandomInt(1, last, postNumber);
    forEachElement('[data-link-to="random"]', function(link) {
        link.href = "/" + random + "/" + subject;
    });
}
if(document.querySelector(".post-nav")) {
    setRandomLink();
}

function showButtonDropdown(e) {
    var thisDropdownSelector = ".dropdown-menu[aria-labelledby='" + e.target.id + "']";    
    toggleVisibility(thisDropdownSelector);
    one(function() {
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
(function() {
    var a = document.createElement("a");
    a.href = window.location.href;
    if(a.pathname === "/") {
        console.log("Changing title here. Trying to get it to show up right on google but still make sense to users");
        // TOOO: maybe - google "regression buddy" and site title is "Algebra: Week 2" except for the "index" page it should be more general
        // serve it with a general title and then change it here. hope that works.

        var postNumber = getPostNumber();
        var subject = getSubject();
        var redirectUrl = window.location.href + postNumber + "/" + subject;
        document.title = "Week " + postNumber + " - " + subject
        try {
            history.replaceState(null, document.title, redirectUrl);            
        }
        catch (ex) {
            window.location.href = redirectUrl;
        }
    }
})();

// lazy load images
window.addEventListener("load", function() {
    var loaded = false;
    function loadImages() {
      if(loaded) {
        return;
      }
      document.querySelectorAll("[data-src]").forEach(function(elm) {
        var src = elm.getAttribute("data-src");
        elm.removeAttribute("data-src");
        elm.setAttribute("src", src);
      });
      loaded = true;
    }
    MathJax.Hub.Queue(loadImages);
    setTimeout(loadImages, 2000);
});

// disqus
var commentsLoaded = false;
function loadComments() {
    var d = document, s = d.createElement('script');
    s.src = 'https://regressionbuddy.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
    commentsLoaded = true;
}

// BEGIN DISQUS GET COUNT MONSTROSITY
var gettingCount = false;
var countCallerCallback = null;
function countCallback(data) // returns comment count or -1 if error
{
    var count = -1;
    try {
        var thread = data.response.filter(function(site) {
            return site.feed.indexOf("regressionbuddy") !== -1;
        })[0];
        count = thread === undefined ? "0" : thread.posts;  
    }
    catch (ex) {
        console.log("FAILED TO PARSE COMMENT COUNT");
        console.log(ex);
    }

    // always do this part
    var commentCountScript = document.getElementById("CommentCountScript");
    document.getElementsByTagName('head')[0].removeChild(commentCountScript);
    countCallerCallback(count);
    gettingCount = false;
    countCallerCallback = null; // if this got reset in the line above this would break something
}
function getCommentCount(callback) {
    if(gettingCount) {
        return;
    }
    gettingCount = true;

    var script = document.createElement('script');
    script.id = "CommentCountScript";
    var apiKey = "api_key=5g0ElGRpBQoGnXjTQWoac3VdOC7R4c2OKYlhbL0ZZpeeU9B0uWQuo8qbRNChro3j";
    var forum = "forum=regressionbuddy"
    var thread = "thread=" + "link:" + window.location.href;
    script.src = 'https://disqus.com/api/3.0/threads/set.jsonp?callback=countCallback&' + apiKey + "&" + forum + "&" + thread;
    countCallerCallback = callback;
    document.getElementsByTagName('head')[0].appendChild(script);
}

var togglingShowComments = true;
getCommentCount(function(count) {
    var commentsLink = document.querySelector("#showCommentsLink");    
    var message = count === -1 ? "show comments" : count + " Comments";
    commentsLink.innerHTML = message;
    togglingShowComments = false;
});
function toggleShowComments(e) {
    if(togglingShowComments) {
        return;
    }
    toggleShowComments = true;

    var commentsLink = document.querySelector("#showCommentsLink");
    var comments = document.getElementById("comments");
    var show = comments.getAttribute("data-showing") === "false";

    toggleVisibility("#comments");
    if(show && commentsLoaded === false) {
        loadComments();
        document.querySelector("#comments").scrollIntoView();
    }

    if(show) {
        commentsLink.innerHTML = "hide comments";
        togglingShowComments = false;
    }
    else {
        getCommentCount(function(count) {
            var message = count === -1 ? "show comments" : count + " Comments";
            commentsLink.innerHTML = message;
            togglingShowComments = false;
        });
    }

    history.replaceState({}, document.title, window.location.pathname); // don't show #disqus_thread in url    
    e.preventDefault();
}
var commentsLink = document.querySelector("#showCommentsLink");
if(commentsLink) {
    // blows up if a page doesn't have comments. just keeping it here though so i dont have to architect a heirarchy for types of pages.
    commentsLink.addEventListener("click", toggleShowComments);
}