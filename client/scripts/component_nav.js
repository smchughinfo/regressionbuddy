// problems / solutions / work
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
    onClick(link, switchComponent);
});