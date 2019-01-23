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
    },
    {
      type: 'button',
      className: 'fullscreen-icon'
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

  function getVideoFromEvent(event) {
    return event.target.parentElement.previousSibling;
  }

  function playPause(event) {
    var video = getVideoFromEvent(event);
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  function togglePlayPause(video, playButton) {
    if (video.paused) {
      playButton.classList.remove('pause-icon');
      playButton.classList.add('play-icon');
    } else {
      playButton.classList.remove('play-icon');
      playButton.classList.add('pause-icon');
    }
  }

  function fullscreen(event) {
    var video = getVideoFromEvent(event);
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.mozRequestFullScreen) {
      video.mozRequestFullScreen(); // Firefox
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen(); // Chrome and Safari
    }
  }

  function updateProgressBar(event) {
    var video = event.target;
    var percentage = Math.floor((100 / video.duration) * video.currentTime);
    this.value = percentage;
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

    button.classList.add('video-control');
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

  Plugins.register('videoplayer', function (api) {
    api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
      if (!config.activate) {
        return;
      }

      // load plugin css for video controls
      var doc = $iframe[0].contentDocument;
      loadCss(doc, css);

      var videos = [].slice.call(doc.querySelectorAll('video'));
      videos.forEach(function (video) {
        // remove native controls
        video.removeAttribute('controls');

        // create custom controls
        var controlsElement = createControlsElement(doc);
        controls.forEach(function (control) {
          controlsElement.appendChild(createElement(doc, control.type, control.className));
        });
        video.parentNode.insertBefore(controlsElement, video.nextSibling);

        // handle play/pause button
        var playButton = controlsElement.querySelector('.play-icon');
        if (playButton) {
          playButton.addEventListener('click', playPause, false);
          video.addEventListener('play', function (event) { togglePlayPause(event.target, playButton); }, false);
          video.addEventListener('pause', function (event) { togglePlayPause(event.target, playButton); }, false);
        }

        // handle fullscreen button
        var fullscreenButton = controlsElement.querySelector('.fullscreen-icon');
        if (fullscreenButton) {
          fullscreenButton.addEventListener('click', fullscreen, false);
          video.addEventListener('fullscreenchange', function () {
            if (doc.fullscreenEnabled && doc.fullscreenElement) {
              video.setAttribute('controls', 'true');
              return;
            }
            video.removeAttribute('controls');
          });
        }

        // handle progress bar
        var seekBar = controlsElement.querySelector('.seek-bar');
        if (seekBar) {
          video.addEventListener('timeupdate', updateProgressBar.bind(seekBar), false);
          seekBar.addEventListener('click', function (event) {
            video.currentTime = (event.offsetX / event.target.clientWidth) * video.duration;
          });
        }

        // display/hide controls
        video.parentElement.addEventListener('mouseenter', function () {
          controlsElement.style.opacity = 1;
        }, false);
        video.parentElement.addEventListener('mouseleave', function () {
          if (video.paused) {
            return;
          }
          controlsElement.style.opacity = 0;
        }, false);
      });
    });
  });

  return config;
});
