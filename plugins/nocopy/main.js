define(['readium_js_plugins'], function (Plugins) {

    // don't block anything by default
    var config = {
        copyCharCount: false,
        pagePrintCount: false,
        blockContext: false,
        whitelist: []
    };

    var currentCopyCharCount = 0;
    var currentPagePrintCount = 0;

    Plugins.register("nocopy", function (api) {

        var blockContext = function (event) {
            if (config.whitelist.indexOf(event.target.nodeName) === -1) {
                event.preventDefault();
            }
        };

        var handleCopy = function (event) {
            const text = document.querySelector('iframe').contentWindow.getSelection().toString();
            if (text.length > config.copyCharCount - currentCopyCharCount) {
                event.preventDefault();
            } else {
              currentCopyCharCount += text.length;
            }
        };

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
            var doc = $iframe[0].contentDocument.documentElement;
            var win = $iframe[0].contentWindow;

            if (config.pagePrintCount !== false) {
              var beforePrint = function () {
                if (currentPagePrintCount >= config.pagePrintCount) {
                  // insert print css
                  loadPrintCss($iframe[0].contentDocument);
                }
              };
              var afterPrint = function () {
                currentPagePrintCount += 1;
              };

              if (!('onbeforeprint' in win) && win.matchMedia) {
                var mediaQueryList = win.matchMedia('print');
                mediaQueryList.addListener(function (mql) {
                  mql.matches ? beforePrint() : afterPrint();
                });
              } else {
                win.addEventListener('beforeprint', beforePrint, false);
                win.addEventListener('afterprint', afterPrint, false);
              }
            }

            if (config.blockContext) {
                doc.addEventListener('contextmenu', blockContext, true);
                api.reader.on(ReadiumSDK.Events.GESTURE_PRESS, blockContext);
            }

            if (config.copyCharCount !== false) {
                doc.addEventListener('copy', handleCopy, true);
                doc.addEventListener('cut', handleCopy, true);
            }
        });
    });

    return config;
});

function loadPrintCss(document) {
  if (!document.head) {
    return;
  }
  if (document.head.querySelector('style[media="print"]')) {
    return;
  }
  var style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.setAttribute('media', 'print');
  style.innerHTML = 'body { display: none }';
  document.head.appendChild(style);
}
