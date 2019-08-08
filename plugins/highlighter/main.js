define(['readium_js_plugins', 'text!./styles.css'], function (Plugins, css) {

  const HIGHLIGHTS_ZONE_ID = 'highlights-zone';

  let highlightRequest = null;
  let lastPaginationData = null;

  Plugins.register('highlighter', function (api) {
    const reader = api.reader;

    reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
      const iframe = $iframe[0];

      loadCss(iframe.contentDocument, css);

      addHightlightsZone(iframe.contentDocument);
    });

    reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function (data) {
      lastPaginationData = data;
      drawHighlight();
    });

    this.highlight = function (cfi, charCount) {
      highlightRequest = {cfi, charCount};
      drawHighlight();
    };

    this.clearHighlight = function () {
      highlightRequest = null;
    };

    function drawHighlight() {
      const openPages = lastPaginationData.paginationInfo.openPages;
      if (openPages.length === 0) {
        return;
      }

      if (highlightRequest === null) {
        return;
      }

      const {cfi, charCount} = highlightRequest;
      const pageIndex = openPages.map(p => p.idref).indexOf(highlightRequest.cfi.idref);
      if (pageIndex === -1) {
        return;
      }

      const iframes = reader.getCurrentView().getIframes();
      for (let iframeIndex = 0; iframeIndex < iframes.length; iframeIndex++) {
        const iframe = iframes[iframeIndex];

        const zone = iframe.contentDocument.getElementById(HIGHLIGHTS_ZONE_ID);
        cleanHighlights(zone);

        if (pageIndex !== iframeIndex) {
          continue;
        }

        const index = cfi.contentCFI.match(/:(\d*)/);
        const range = reader.getDomRangeFromRangeCfi(
          cfi,
          {idref: cfi.idref, contentCFI: cfi.contentCFI.replace(/:(\d*)/, `:${parseInt(index[1], 10) + charCount}`)}
        );

        const rectList = range.getClientRects();
        const filteredRectList = [...new Set(Array.from(rectList).map(r => JSON.stringify(r.toJSON())))].map(r => JSON.parse(r));
        const lineHeight = Math.min.apply(null, filteredRectList.map(function (r) {
          return r.height;
        }));

        filteredRectList.forEach(function (rect) {
          if (rect.height > 2 * lineHeight) {
            return;
          }
          if (rect.left < 0 || (rect.left + rect.width) > document.documentElement.clientWidth) {
            return;
          }
          drawElement(iframe.contentDocument, zone, 'yellow', rect.left, rect.top, rect.width, rect.height);
        });
      }
    }
  });

  function loadCss(document, css) {
    if (!document.head) {
      return;
    }
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  function addHightlightsZone(document) {
    const div = document.createElement('div');
    div.id = HIGHLIGHTS_ZONE_ID;
    document.body.append(div);

    return div;
  }

  function cleanHighlights(zone) {
    while (zone.firstChild) {
      zone.removeChild(zone.firstChild);
    }
  }

  function drawElement(document, zone, color, left, top, width, height) {
    const div = document.createElement('div');
    div.classList.add('highlight-element');
    div.style.left = left + 'px';
    div.style.top = top + 'px';
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    zone.append(div);

    return div;
  }
});
