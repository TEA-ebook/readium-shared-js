define(['readium_js_plugins', 'text!./styles.css'], function (Plugins, css) {

  const HIGHLIGHTS_ZONE_ID = 'highlights-zone';

  Plugins.register('highlighter', function (api) {
    const reader = api.reader;

    let cfiToHighlight = null;

    reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
      var iframe = $iframe[0];

      loadCss(iframe.contentDocument, css);

      addHightlightsZone(iframe.contentDocument);

      if (cfiToHighlight !== null) {
        drawHighlight(cfiToHighlight, 6);
      }
    });

    this.highlight = function (cfi) {
      cfiToHighlight = cfi;
      reader.openSpineItemElementCfi(cfi.idref, cfi.contentCFI);
    };

    function drawHighlight(cfi, length) {
      const iframes = reader.getCurrentView().getIframes();
      iframes.forEach(iframe => {
        const zone = iframe.contentDocument.getElementById(HIGHLIGHTS_ZONE_ID);
        cleanHighlights(zone);

        const index = cfi.contentCFI.match(/:(\d*)/);
        const range = reader.getDomRangeFromRangeCfi(
          cfi,
          {idref: cfi.idref, contentCFI: cfi.contentCFI.replace(/:(\d*)/, `:${parseInt(index[1], 10) + length}`)}
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
      });
    };
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
