define(['readium_js_plugins', 'text!./styles.css'], function (Plugins, css) {

  var HIGHLIGHTS_ZONE_ID = 'annotations-highlights-zone';
  var NOTES_ZONE_ID = 'annotations-notes-zone';

  var annotations = [];
  var iframe;
  var spine;
  var spineAnnotations = [];

  Plugins.register('annotations', function (api) {
    var reader = api.reader;

    reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
      iframe = $iframe[0];
      loadCss(iframe.contentDocument, css);

      spine = reader.getLoadedSpineItems()[0];
      spineAnnotations = annotations.filter(function (annotation) {
        return annotation.range.start.containerRef === spine.idref;
      });

      addHightlightsZone(iframe.contentDocument);
      addNotesZone(iframe.contentDocument);

      handleSelection(iframe);

      reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function () {
        displayAnnotations(iframe.contentDocument, spineAnnotations);
      });
    });

    this.loadAnnotations = function (annotationList) {
      annotations = annotationList || [];

      if (spine) {
        spineAnnotations = annotationList.filter(function (annotation) {
          return annotation.range.start.containerRef === spine.idref;
        });
        displayAnnotations(iframe.contentDocument, spineAnnotations);
      }
    };

    function handleSelection(iframe) {
      var document = iframe.contentDocument.documentElement;
      var iframeWindow = iframe.contentWindow;

      document.addEventListener('mouseup', function () {
        var selection = iframeWindow.getSelection();
        var selectedText = selection.toString().trim();

        if (selectedText.length > 0) {
          var cfiRange = reader.getRangeCfiFromDomRange(selection.getRangeAt(0));
          var rangeParts = cfiRange.contentCFI.split(',');
          var currentSpine = reader.spine().getItemById(cfiRange.idref);

          reader.emit(ReadiumSDK.Events.TEXT_SELECTED, {
            text: selectedText,
            range: {
              contentCFI: cfiRange.contentCFI,
              start: {
                cfi: 'epubcfi(' + currentSpine.cfi + rangeParts[0] + rangeParts[1] + ')',
                containerRef: cfiRange.idref
              },
              end: {
                cfi: 'epubcfi(' + currentSpine.cfi + rangeParts[0] + rangeParts[2] + ')',
                containerRef: cfiRange.idref
              }
            },
            event: {x: event.clientX, y: event.clientY}
          });
        }
      });
    }

    function displayAnnotations(document, annotations) {
      if (!document) {
        return;
      }

      // clean highlights
      var highlightsZone = document.getElementById(HIGHLIGHTS_ZONE_ID);
      cleanMarkers(highlightsZone);

      // clean notes
      var notesZone = document.getElementById(NOTES_ZONE_ID);
      cleanMarkers(notesZone);

      // empty current selection
      iframe.contentWindow.getSelection().empty();

      annotations.forEach(function (annotation) {
        var annotationRange = reader.getDomRangeFromRangeCfi(annotation.range);
        var rectList = annotationRange.getClientRects();

        //console.time('sortRectList');
        var filteredRectList = [ ...new Set(Array.from(rectList).map(r => JSON.stringify(r.toJSON())))].map(r => JSON.parse(r));
        //console.timeEnd('sortRectList');

        var lineHeight = Math.min.apply(null, filteredRectList.map(function (r) { return r.height; }));

        var lastRect = rectList[rectList.length - 1];
        var annotationElement = drawAnnotation(document, highlightsZone, lastRect.left + lastRect.width, lastRect.top);

        filteredRectList.forEach(function (rect) {
          if (rect.height > 2 * lineHeight) {
            return;
          }
          if (rect.left < 0 || (rect.left + rect.width) > document.documentElement.clientWidth) {
            return;
          }
          drawElement(document, annotationElement, annotation.color, rect.left, rect.top, rect.width, rect.height);
        });
        if (annotation.note) {
          drawNote(document, notesZone, onNoteClick.bind(annotation), lastRect.left + lastRect.width, lastRect.top);
        }
      });
    }

    function onNoteClick(event) {
      reader.emit(ReadiumSDK.Events.ANNOTATION_CLICK, {
        annotation: this,
        event: {x: event.clientX, y: event.clientY}
      });
    }
  });

  function addHightlightsZone(document) {
    const div = document.createElement('div');
    div.id = HIGHLIGHTS_ZONE_ID;
    document.body.append(div);

    return div;
  }

  function addNotesZone(document) {
    const div = document.createElement('div');
    div.id = NOTES_ZONE_ID;
    document.body.append(div);

    return div;
  }

  function drawAnnotation(document, zone, left, top) {
    const div = document.createElement('div');
    div.classList.add('annotation');
    div.style.left = left + 'px';
    div.style.top = top + 'px';
    zone.append(div);

    return div;
  }

  function drawElement(document, zone, color, left, top, width, height) {
    const div = document.createElement('div');
    div.classList.add('annotation-element');
    div.style.left = left + 'px';
    div.style.top = top + 'px';
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    zone.append(div);

    return div;
  }

  function drawNote(document, zone, clickHandler, left, top) {
    const div = document.createElement('div');
    div.classList.add('annotation-note');
    div.style.left = left + 'px';
    div.style.top = top + 'px';
    zone.append(div);
    div.addEventListener('click', clickHandler, false);

    return div;
  }

  function cleanMarkers(zone) {
    while (zone.firstChild) {
      zone.removeChild(zone.firstChild);
    }
  }

  function loadCss(document, css) {
    if (!document.head) {
      return;
    }
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);
  }
});
