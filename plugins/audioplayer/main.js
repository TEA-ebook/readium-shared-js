define(['readium_js_plugins', 'text!./styles.css'], function (Plugins, css) {

  var config = {
    activate: false
  };

  var controls = [
    {
      type: 'button',
      className: 'play-icon'
    },
    {
      type: 'range',
      className: 'seek-bar'
    }
  ];

  function loadCss(document, css) {
    if (!document.head) {
      return;
    }
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  function playPause(reader) {
    if (reader.isPlayingMediaOverlay()) {
      reader.pauseMediaOverlay();
    } else {
      reader.playMediaOverlay();
    }
  }

  function createControlsElement(document) {
    var controls = document.createElement('div');
    controls.classList.add('video-controls');
    return controls;
  }

  function createElement(document, type, className) {
    if (type === 'button') {
      return createButtonElement(document, className);
    } else if (type === 'range') {
      return createRangeElement(document, className);
    }
  }

  function createButtonElement(document, className) {
    var button = document.createElement('button');

    button.classList.add('audio-control');
    button.classList.add(className);

    return button;
  }

  function createRangeElement(document, className) {
    var range = document.createElement('progress');

    range.classList.add(className);

    range.setAttribute('value', '0');
    range.setAttribute('min', '0');
    range.setAttribute('max', '100');

    return range;
  }

  Plugins.register('audioplayer', function (api) {
    api.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function () {
      if (!config.activate) {
        return;
      }

      if (api.reader.isMediaOverlayAvailable()) {
        var doc = api.reader.getFirstVisibleMediaOverlayElement().getRootNode();
        loadCss(doc, css);
        var controlsElement = createControlsElement(doc);

        controls.forEach(function (control) {
          controlsElement.appendChild(createElement(doc, control.type, control.className));
        });
        doc.body.appendChild(controlsElement);

        // handle play/pause button
        var playButton = controlsElement.querySelector('.play-icon');
        if (playButton) {
          playButton.addEventListener('click', function (e) {
            playPause(api.reader);
          }, false);
        }
      }
    });
  });

  return config;
});
