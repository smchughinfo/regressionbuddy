/****** IMAGE MAXIMIZER ******/
function maximizeImage(img) {
    if (img.closest(".open-graph") === null) {
        var bigImage = document.getElementById("bigImage");
        var layover = document.querySelector(".layover");

        bigImage.src = img.src;
        layover.className = layover.className.replace(/\bhidden-layover\b/g, "");
        document.body.className += " blur";
    }
}

function unmaximizeImage() {
    var layover = document.querySelector(".layover");
    layover.className += " hidden-layover";
    document.body.className = document.body.className.replace(/\bblur\b/g, "");
}

function anyMaximizedImage(){
    var layover = document.querySelector(".layover");
    return /\bhidden-layover\b/g.test(layover.className) === false;
}

function toggleImageMaximization(e) {
    if(anyMaximizedImage()) {
        unmaximizeImage();
    }
    else {
        if(e.target.tagName.toLowerCase() === "img") {
            maximizeImage(e.target);
        }
    }
}
onClick(window, toggleImageMaximization);