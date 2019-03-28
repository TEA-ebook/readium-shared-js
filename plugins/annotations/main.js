define(['readium_js_plugins'], function (Plugins) {

  var ANNOTATIONS_ZONE_ID = 'annotations-zone';

  var lastSelectedText = '';
  var annotations = [];
  var iframe;
  var spine;
  var spineAnnotations = [];

  Plugins.register('annotations', function (api) {
    var reader = api.reader;

    reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
      iframe = $iframe[0];
      spine = reader.getLoadedSpineItems()[0];
      spineAnnotations = annotations.filter(annotation => annotation.range.idref === spine.idref);

      addAnnotationsZone(iframe.contentDocument);

      handleSelection(iframe);

      reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function () {
        displayAnnotations(iframe.contentDocument, spineAnnotations);
      });
    });

    this.loadAnnotations = function (annotationList) {
      annotations = annotationList || [];

      if (spine) {
        spineAnnotations = annotationList.filter(annotation => annotation.range.idref === spine.idref);
        displayAnnotations(iframe.contentDocument, spineAnnotations);
      }
    };

    function handleSelection(iframe) {
      var document = iframe.contentDocument.documentElement;
      var iframeWindow = iframe.contentWindow;

      document.addEventListener('mouseup', function (event) {
        var selection = iframeWindow.getSelection();
        var selectedText = selection.toString().trim();

        if (selectedText.length > 0 && selectedText !== lastSelectedText) {
          var cfiRange = reader.getRangeCfiFromDomRange(selection.getRangeAt(0));

          reader.emit(ReadiumSDK.Events.TEXT_SELECTED, {
            text: selectedText,
            range: {contentCFI: cfiRange.contentCFI, idref: cfiRange.idref},
            event: {x: event.clientX, y: event.clientY}
          });

          lastSelectedText = selectedText;
        }
      });
    }

    function displayAnnotations(document, annotations) {
      if (!document) {
        return;
      }

      var zone = document.getElementById(ANNOTATIONS_ZONE_ID);

      cleanMarkers(zone);

      annotations.forEach(function (annotation) {
        var annotationRange = reader.getDomRangeFromRangeCfi(annotation.range);

        var rectList = annotationRange.getClientRects();
        var lineHeight = Math.min.apply(null, Array.from(rectList).map(r => r.height));

        Array.from(rectList).forEach(rect => {
          if (rect.height > lineHeight) {
            return;
          }
          if (rect.left < 0 || (rect.left + rect.width) > document.documentElement.clientWidth) {
            return;
          }
          drawRect(document, zone, rect.left, rect.top, rect.width, rect.height);
        });
      });
    }
  });

  function addAnnotationsZone(document) {
    const div = document.createElement('div');
    div.id = ANNOTATIONS_ZONE_ID;
    div.style.position = 'fixed';
    div.style.left = `0`;
    div.style.top = `0`;
    div.style.width = `100vw`;
    div.style.height = `100vh`;
    div.style.zIndex = '-10';
    div.style.pointerEvents = 'none';
    document.body.append(div);

    return div;
  }

  function drawRect(document, zone, left, top, width, height) {
    const div = document.createElement('div');
    div.classList.add('annotation');
    div.style.position = 'fixed';
    div.style.left = `${left}px`;
    div.style.top = `${top}px`;
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.zIndex = '-10';
    div.style.opacity = '0.4';
    div.style.pointerEvents = 'none';
    div.style.backgroundColor = 'yellow';
    zone.append(div);
  }

  function cleanMarkers(document) {
    Array.from(document.getElementsByClassName('annotation')).forEach(el => el.parentNode.removeChild(el));
  }
});
