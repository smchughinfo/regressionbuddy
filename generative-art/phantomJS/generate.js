var page = require('webpage').create();
page.viewportSize = {
    width: 1100,
    height: 400
  };



  page.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
  };

  page.open("http://192.168.200.199:9966/", function(status) {
    if(status === "success") {
        console.log("SUCCESS");
        page.render("images/" + "pre.png");


page.settings.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0';




        setTimeout(function() {
            console.log("LOADED ENOUGH,TRYIG CLICK");
            page.evaluate(function() {
                function click(el){
                    var ev = document.createEvent("MouseEvent");
                    ev.initMouseEvent(
                        "mousedown",
                        true /* bubble */, true /* cancelable */,
                        window, null,
                        0, 0, 0, 0, /* coordinates */
                        false, false, false, false, /* modifier keys */
                        0 /*left*/, null
                    );
                    el.dispatchEvent(ev);
                }
                click(document.querySelector("canvas"))
            });

            console.log("CLICK, WAITING 5");
            setTimeout(function() {
                console.log("FINAL...");
                page.render("images/" + "IMAGECOUNT.png");
            }, 5000);

        }, 1000);
        
    }
    else {
        console.log("not success - " + status);
    }
  });

