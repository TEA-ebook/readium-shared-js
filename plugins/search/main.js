define(['readium_js_plugins', 'readium_shared_js/globals', './manager'], function (Plugins, Globals, SearchManager) {
    var config = {};

    Plugins.register("search", function (api) {
        var reader = api.reader, _searchManager, _initialized = false, _initializedLate = false;

        var self = this;

        function isInitialized() {
            if (!_initialized) {
                api.plugin.warn('Not initialized!')
            }
            return _initialized;
        }

        this.initialize = function (options) {
            options = options || {};

            setTimeout(isInitialized, 1000);

            if (_initialized) {
                api.plugin.warn('Already initialized!');
                return;
            }

            _searchManager = new SearchManager(self, options);

            if (_initializedLate) {
                api.plugin.warn('Unable to attach to currently loaded content document.\n' +
                'Initialize the plugin before loading a content document.');
            }

            _initialized = true;
        };

        this.getSearchManager = function() {
            return _searchManager;
        };

    this.FindAllOccurencesOfStringForElement = function(element,keyword,resArray) {
      if (element) {
        if (element.nodeType == 3) {        // Text node
          var valueStartIndex = 0;
          var value = element.nodeValue.toLowerCase();
          while (true) {
            var idx = value.indexOf(keyword);

            if (idx < 0) break;             // not found, abort

            idx += valueStartIndex;

            var textrange = document.createRange();
            textrange.setStart(element, idx);
            textrange.setEnd(element, idx+keyword.length);

            rangeCFIComponent = EPUBcfi.generateRangeComponent(
                element,
                idx,
                element,
                idx+keyword.length, ["cfi-marker", "cfi-blacklist", "mo-cfi-highlight"], [], ["MathJax_Message", "MathJax_SVG_Hidden"]
            );

            var idx_before = idx-100;
            if (idx_before<0)
              idx_before = 0;
            var idx_before_end = idx_before+100;
            if (idx_before_end>=idx)
              idx_before_end = idx;
            if (idx_before_end<0)
              idx_before_end = 0;
            var idx_after = idx+keyword.length;
            var idx_after_end = idx_after+100;
            if (idx_after_end>element.nodeValue.length)
              idx_after_end = element.nodeValue.length;

            var search_result = {range: rangeCFIComponent, before: element.nodeValue.substring(idx_before,idx_before_end), after: element.nodeValue.substring(idx_after,idx_after_end)};

            resArray.push(search_result);

            valueStartIndex = idx+keyword.length;
            value = value.substring(valueStartIndex);
          }
        } else if (element.nodeType == 1) { // Element node
          if (element.contentDocument) {
            var framedocbody = element.contentDocument.body;
            if (framedocbody) {
              this.FindAllOccurencesOfStringForElement(framedocbody,keyword,resArray);
            }
          }
          if (element.style.display != "none" && element.nodeName.toLowerCase() != 'select') {
            for (var i=element.childNodes.length-1; i>=0; i--) {
              this.FindAllOccurencesOfStringForElement(element.childNodes[i],keyword,resArray);
            }
          }
        }
      }
    };

    this.FindAllOccurencesOfString = function(keyword) {
      var resultArray = [];
      this.FindAllOccurencesOfStringForElement(document.body, keyword.toLowerCase(), resultArray);
      resultArray.sort(function(a,b) {
        cmp = EPUBcfi.compareCFIs("epubcfi("+a.range+")","epubcfi("+b.range+")");
        return cmp[0];
      });
      return JSON.stringify(resultArray);
    };

        reader.on(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
        });

    });

    return config;
});
