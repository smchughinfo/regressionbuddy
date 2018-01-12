// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        if (!document.documentElement.contains(el)) return null;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement;
        } while (el !== null); 
        return null;
    };
}

function forEachElement(selector, func) {
    document.querySelectorAll(selector).forEach(function(elm) {
        func(elm);
    });
}

function getRandomInt(minInclusive, maxInclusive, except) {
    for(var i = 0; i < 1000; i++) {
        var random = Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
        if(except == null || random !== except) {
            return random;
        }
        if(i === 999) {
            throw "ERROR CREATING RANDOM NUMBER";
        }
    }
};

function toggleVisibility(selector) {
    var elm = document.querySelector(selector);
    if(elm) {
        var isVisible = elm.getAttribute("data-showing") === "true";
        setVisibility(selector, !isVisible);  
    }
}

function setVisibility(selector, visible) {
    var elm = document.querySelector(selector);
    elm.setAttribute("data-showing", visible ? "true" : "false");   
}

function one(handler) {
    // there is a built in once https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
    function _handler(e) {
        document.removeEventListener("click", _handler);
        handler(e);
    }
    document.addEventListener("click", _handler);
}

// nodelist foreach polyfill for ie
// https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}

function getSubject() {
    return document.body.getAttribute("data-subject").replace(/_/g, "-");    
}

function getPostNumber() {
    return parseInt(document.body.getAttribute("data-post-number"), 10);
}

// https://gist.github.com/nmsdvid/8807205
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		}, wait);
		if (immediate && !timeout) func.apply(context, args);
	};
}


function removeElements(selector) {
    var elms = document.querySelectorAll(selector);
    for(var i = 0; i < elms.length; i++) {
        elms[i].parentNode.removeChild(elms[i]);
    }
}

function displayFullScreenIframe(src) {
    removeElements("iframe");

    var img = document.createElement("img");
    img.className = "close-graph";
    img.src = "/images/graph-down.png";
    img.title = "Close Graph";;

    var closer = document.createElement("div");
    closer.className += "close-iframe";
    closer.appendChild(img);
    document.body.appendChild(closer);

    var layover = document.createElement("div");
    layover.className = "layover";
    document.body.appendChild(layover);

    var iframe = document.createElement("iframe");
    iframe.className = "full-screen-iframe";
    iframe.setAttribute("scrolling", "no");
    iframe.src = src;
    document.body.appendChild(iframe);

    document.body.className += " blur";
}

function closeFullScreenIframe() {
    removeElements("iframe");
    removeElements(".close-iframe");
    removeElements(".layover");
    document.body.className = document.body.className.replace(/\bblur\b/g, "");
}