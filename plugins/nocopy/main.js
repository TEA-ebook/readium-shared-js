define(['readium_js_plugins'], function (Plugins) {

    // don't block anything by default
    var config = {
        copyCharCount: false,
        blockContext: false,
        whitelist: []
    };

    var currentCopyCharCount = 0;

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
