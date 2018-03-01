// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent
// https://coderwall.com/p/bdxjzg/tap-vs-click-death-by-ignorance
// there is a built in once https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
/*
    started with just click. ios needed touch events for the cheat light so tried just using touchstart.
    touchstart doesn't let you scroll if you touch an image.
    added a home made tap handler to work around this.
    
    tried many combinations of preventDefault, stopImmediatePropogation, and attaching events directly on
    elements as opposed to window but this would fix one thing and break another. plus it made it way more
    complicated because i didn't know which event i was getting in the handler or if preventdefault or 
    stopImmediatePropogation was even working.
*/
function onClick(element, handler, once) {
    var lastHandled = 0;
    function _handler(e) {
        if(once) {
            element.removeEventListener("click", _clickHandler);
            element.removeEventListener("touchstart", _touchStartHandler);  
        }
        
        var curTime = (new Date()).getTime();
        var timeSinceLastHandled = curTime - lastHandled;
        if(lastHandled === 0 || timeSinceLastHandled > 500 ) {
            lastHandled = curTime;
            handler(e);
        }
    }

    function _clickHandler(e) {
        var hasButton = e && e.button !== undefined;
        if(hasButton) {
            if(e.button === 0) { // left button
                _handler(e);
            }
        }
        else {
            _handler(e);
        }
    }

    function _touchStartHandler(e) {
        function _touchEndHandler(e) {
            var timeSinceTouchStart = (new Date()).getTime() - touchStarted;
            element.removeEventListener("touchend", _touchEndHandler);
            if(timeSinceTouchStart < 500) {
                _handler(e);
            }
        }
        function _touchMoveHandler(e) {
            element.removeEventListener("touchend", _touchEndHandler);
            element.removeEventListener("touchmove", _touchMoveHandler);
        }
        
        var touchStarted = (new Date()).getTime();
        // if(noAnchors(e)) { e.preventDefault();  } // so anchor tags can still navigate. nm prevents scrolling on images, dont use.
        element.addEventListener("touchend", _touchEndHandler);
        element.addEventListener("touchmove", _touchMoveHandler);
    }

    element.addEventListener("click", _clickHandler);
    element.addEventListener("touchstart", _touchStartHandler); 
}

/*function noAnchors(e) {
    // fires 300ms before click. e.preventDefault() should stop click from running
    // except if the thing that recieved the touchstart is an anchor tag, don't prevent default so that it can act like an anchor tag
    var noAnchors = true;
    for(var i = 0; i < e.touches.length; i++) {
        var isAnchor = e.touches[i].target.tagName.toLowerCase() === "a";
        if(isAnchor) {
            noAnchors = false;
            break;
        }
    }
    return noAnchors;
}*/