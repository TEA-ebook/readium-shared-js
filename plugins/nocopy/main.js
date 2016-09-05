define(['readium_js_plugins'], function (Plugins) {

    // don't block anything by default
    var config = {
        blockCopy: false,
        blockContext: false,
        whitelist: []
    };

    Plugins.register("nocopy", function (api) {

        var block = function (event) {
            if (config.whitelist.indexOf(event.target.nodeName) === -1) {
                event.preventDefault();
            }
        };

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
            var doc = $iframe[0].contentDocument.documentElement;

            if (config.blockContext) {
                doc.addEventListener('contextmenu', block, true);
                api.reader.on(ReadiumSDK.Events.GESTURE_PRESS, block);
            }

            if (config.blockCopy) {
                doc.addEventListener('copy', block, true);
                doc.addEventListener('cut', block, true);
            }
        });
    });

    return config;
});
