define(['readium_js_plugins', 'text!./styles.css'], function (Plugins, css) {

  var HIGHLIGHTS_ZONE_ID = 'annotations-highlights-zone';
  var NOTES_ZONE_ID = 'annotations-notes-zone';

  var annotations = [];
  var lastPaginationData;

  Plugins.register('annotations', function (api) {
    var reader = api.reader;

    reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
      var iframe = $iframe[0];

      loadCss(iframe.contentDocument, css);

      addHightlightsZone(iframe.contentDocument);
      addNotesZone(iframe.contentDocument);

      handleSelection(iframe);
    });

    reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function (data) {
      lastPaginationData = data;
      displayAnnotations();
    });

    this.loadAnnotations = function (annotationList) {
      annotations = annotationList || [];
      displayAnnotations();
    };

    function handleSelection(iframe) {
      var document = iframe.contentDocument.documentElement;
      var iframeWindow = iframe.contentWindow;

      document.addEventListener('mouseup', function (event) {
        var selection = iframeWindow.getSelection();
        var selectedText = selection.toString().trim();

        if (selectedText.length > 0) {
          var cfiRange = reader.getRangeCfiFromDomRange(selection.getRangeAt(0));
          var rangeParts = cfiRange.contentCFI.split(',');

          reader.emit(ReadiumSDK.Events.TEXT_SELECTED, {
            text: selectedText,
            range: {
              contentCFI: cfiRange.contentCFI,
              start: {
                partialCfi: rangeParts[0] + rangeParts[1],
                containerRef: cfiRange.idref
              },
              end: {
                partialCfi: rangeParts[0] + rangeParts[2],
                containerRef: cfiRange.idref
              }
            },
            event: {x: event.clientX, y: event.clientY}
          });
        }
      });
    }

    function displayAnnotations() {
      if (!lastPaginationData) {
        return;
      }

      var iframes = reader.getCurrentView().getIframes();
      var openPages = lastPaginationData.paginationInfo.openPages;

      var index = 0;
      Array.from(iframes).forEach(function (iframe) {
        var page = openPages[index];
        if (!page) {
          return;
        }

        var idref = page.idref;

        var spineAnnotations = annotations.filter(function (annotation) {
          return annotation.range.start.containerRef === idref;
        });

        // clean highlights
        var highlightsZone = iframe.contentDocument.getElementById(HIGHLIGHTS_ZONE_ID);
        cleanMarkers(highlightsZone);

        // clean notes
        var notesZone = iframe.contentDocument.getElementById(NOTES_ZONE_ID);
        cleanMarkers(notesZone);

        // empty current selection
        iframe.contentWindow.getSelection().empty();

        spineAnnotations.forEach(function (annotation) {
          var cfis = annotationRangeToSeparateCfis(annotation.range);
          var annotationRange = reader.getDomRangeFromRangeCfi(cfis.start, cfis.end);
          var rectList = annotationRange.getClientRects();

          //console.time('sortRectList');
          var filteredRectList = [...new Set(Array.from(rectList).map(r => JSON.stringify(r.toJSON())))].map(r => JSON.parse(r));
          //console.timeEnd('sortRectList');

          var lineHeight = Math.min.apply(null, filteredRectList.map(function (r) {
            return r.height;
          }));

          var lastRect = rectList[rectList.length - 1];
          var annotationElement = drawAnnotation(document, highlightsZone, lastRect.left + lastRect.width, lastRect.top);

          filteredRectList.forEach(function (rect) {
            if (rect.height > 2 * lineHeight) {
              return;
            }
            if (rect.left < 0 || (rect.left + rect.width) > document.documentElement.clientWidth) {
              return;
            }
            drawElement(iframe.contentDocument, annotationElement, annotation.color, rect.left, rect.top, rect.width, rect.height);
          });
          if (annotation.note) {
            drawNote(iframe.contentDocument, notesZone, onNoteClick.bind(annotation), lastRect.left + lastRect.width, lastRect.top);
          }
        });

        index++;
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

  function annotationRangeToSeparateCfis(annotationRange) {
    const rangeParts = annotationRange.contentCFI.split(',');
    return {
      start: {
        contentCFI: rangeParts[0] + rangeParts[1],
        idref: annotationRange.start.containerRef
      },
      end: {
        contentCFI: rangeParts[0] + rangeParts[2],
        idref: annotationRange.end.containerRef
      }
    }
  }
});
