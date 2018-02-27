var comments = document.querySelector("#comments");
var apiKey = "api_key=5g0ElGRpBQoGnXjTQWoac3VdOC7R4c2OKYlhbL0ZZpeeU9B0uWQuo8qbRNChro3j";
var forum = "forum=regressionbuddy"

if(comments) {
    var commentsLoaded = false;
    function loadComments() {
        var d = document, s = d.createElement('script');
        s.src = 'https://regressionbuddy.disqus.com/embed.js';
        s.setAttribute('data-timestamp', + new Date());
        (d.head || d.body).appendChild(s);
        commentsLoaded = true;
    }

    function normalizeDisqusLink(link) {
        if (link.indexOf("regressionbuddy") !== -1) { // not localhost 
            link = "https://" + link.substring(link.indexOf("regressionbuddy"));
        }
        return link;
    }

    function getCommentCountForCurrentUrl(callback) {
        getCommentCountForUrl(window.location.href, callback);
    }

    function getCommentCountForUrl(url, callback) {
        var thread = "thread=" + "link:" + normalizeDisqusLink(url);
        var url = 'https://disqus.com/api/3.0/threads/set.json?' + apiKey + "&" + forum + "&" + thread;
        getCommentCountFromDisqus(url, callback);
    }

    function getCommentCountFromDisqus(url, callback) {
        get(url, function(response) {
            response = JSON.parse(response);

            var thread = response.response.filter(function (site) {
                return site.feed.indexOf("regressionbuddy") !== -1;
            })[0];
            count = thread === undefined ? 0 : thread.posts;
            
            callback(count);
        });
    }

    var togglingShowComments = true;
    getCommentCountForCurrentUrl(function (count) {
        var commentsLink = document.querySelector("#showCommentsLink");
        var message = count === -1 ? "show comments" : count + " Comments";
        commentsLink.innerHTML = message;
        togglingShowComments = false;
    });

    function toggleShowComments(e) {
        if (togglingShowComments) {
            return;
        }
        toggleShowComments = true;

        var commentsLink = document.querySelector("#showCommentsLink");
        var comments = document.getElementById("comments");
        var show = comments.getAttribute("data-showing") === "false";

        toggleVisibility("#comments");
        if (show && commentsLoaded === false) {
            loadComments();
            document.querySelector("#comments").scrollIntoView();
        }

        if (show) {
            commentsLink.innerHTML = "hide comments";
            togglingShowComments = false;
        }
        else {
            getCommentCountForCurrentUrl(function (count) {
                var message = count === -1 ? "show comments" : count + " Comments";
                commentsLink.innerHTML = message;
                togglingShowComments = false;
            });
        }

        clearHash();
        e.preventDefault();
    }


    var isReviewPage = document.getElementById("review") !== null;
    if (isReviewPage) {
        var links = [];
        forEachElement("[data-link-with-comments='true']", function (a) {
            links.push(a.href);
        });

        var counts = [];
        aFor(links, getCommentCountForUrl, function(link, count, done) {
            var relLink = link.split(window.location.host)[1];
            var commentCountElm = document.querySelector("[data-comment-count-for='" + relLink + "']");
            counts.push({
                elm: commentCountElm,
                count: count
            });

            if(done) {
                counts.forEach(function(countObj) {
                    countObj.elm.innerHTML = " - " + countObj.count + " Comments";
                });
            }
        });
    }

    var commentsLink = document.querySelector("#showCommentsLink");
    if (commentsLink) {
        onClick(commentsLink, toggleShowComments);
    }
}