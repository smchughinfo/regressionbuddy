/****** REDIRECT TO NORMALIZED URL ******/
(function () {
    var a = document.createElement("a");
    a.href = window.location.href;
    if (a.pathname === "" || a.pathname === "/") {
        console.log("Changing title here. Trying to get it to show up right on google but still make sense to users");
        // TOOO: maybe - google "regression buddy" and site title is "Algebra: Post 2" except for the "index" page it should be more general
        // serve it with a general title and then change it here. hope that works.

        try {
            var postNumber = getPostNumber();
            var subject = getSubject();
            var redirectUrl = window.location.href + postNumber + "/" + subject;
            document.title = "Post " + postNumber + " - " + capatalizeFirstLetterOfEveryWord(subject);

            console.log("this needs to run before getting disqus comment count");
            history.replaceState(null, document.title, redirectUrl);
        }
        catch (ex) {
            window.location.href = redirectUrl;
        }
    }
})();

/****** MATCH HASH ******/
var isSolutions = window.location.hash === "#solutions";
var isWork = window.location.hash === "#work";
if(isSolutions || isWork) {
    document.querySelector("[href='" + window.location.hash + "']").click();
}