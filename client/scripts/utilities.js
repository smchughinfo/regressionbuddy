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
        if(e && e.button === 0) {
            window.removeEventListener("click", _handler);
            handler(e);
        }
    }
    window.addEventListener("click", _handler);
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

function capatalizeFirstLetterOfEveryWord(word) {
    return word.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function get(url, successCallback, errorCallback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status === 200) {
                successCallback(this.responseText);
            }
            else {
                errorCallback(this.status)
            }
        }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

function reportErrorToUser(msg) {
    removeElements("#reportedError");

    var nav = document.querySelector("body nav");

    var errorDiv = document.createElement("div");
    errorDiv.id = "reportedError";
    errorDiv.className = "alert alert-danger";
    errorDiv.innerHTML = msg;

    insertAfter(errorDiv, nav);
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function aFor(arr, func, itr) {
    var todo = arr.length;
    var done = 0;

    function iterate() {
        func(arr[done], function(data) { // call the async function
            itr(arr[done], data, (done + 1 === todo)); // call the itr callback so caller can do per-element processing

            done++;
            if(done < todo) {
                iterate();
            }
        });
    }
    iterate();
}

function clearHash() {
    try {
        history.replaceState({}, document.title, window.location.pathname); // hash would only ever get used if a user didnt have javascript. in that case it's used to show hide problems, solutions, and work'
    }
    catch (ex) {
        window.location.hash = "";
    }
}

function onClick(element, handler) { // caller should be able to call element.removeEventListener(handler
    element.addEventListener("click", function(e) {
        // https://www.w3schools.com/jsref/event_button.asp
        if(e && e.button === 0) {
            handler(e);
        }
    });
}