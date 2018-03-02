/****** CHEAT CODE ******/
function showCheat(cheatLight) {
    var cheatContainer = cheatLight.closest(".cheat-container")
    var cheatText = cheatContainer.querySelector("cheat-text");
    
    var on = /\bon\b/.test(cheatContainer.className);
    if(on) {
        cheatContainer.className = cheatContainer.className.replace(/\bon\b/g, "");
    }
    else {
        cheatContainer.className += " on";
    }
}

function hideCheat() {
    forEachElement(".cheat-container", function(cheatContainer) {
        cheatContainer.className = cheatContainer.className.replace(/\bon\b/g, "");
    });
}

function toggleCheat(e) {
    var toggleCheat = /\bcheat-light\b/.test(e.target.className);
    if(toggleCheat) {
        showCheat(e.target);
    }
    else {
        var messingWithText =  /\bcheat-text\b/.test(e.target.className);
        if(!messingWithText) {
            hideCheat();
        }
    }
}
onClick(window, toggleCheat);