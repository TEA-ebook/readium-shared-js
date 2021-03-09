define(['readium_js_plugins', 'jquery', 'hammer'], function (Plugins, $, Hammer) {

  Plugins.register('gestures', function (api) {
    var plugin = this;

    api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe) {
      var doc = $iframe[0].contentDocument.documentElement;
      var iframe = $iframe[0].contentWindow;

      // remove stupid ipad safari elastic scrolling (improves UX for gestures)
      $(doc).on('touchmove', function (e) {
        if (isGestureHandled(api.reader)) {
          e.preventDefault();
        }
      });

      // set hammer's document root
      setupHammer(plugin, Hammer, api.reader, iframe, doc);

      // mouse events
      doc.addEventListener('mousemove', function (event) {
        if (event.movementX === 0 || event.movementY === 0) {
          return;
        }
        api.reader.trigger(ReadiumSDK.Events.MOUSE_MOVE, event);
      }, false);

      iframe.addEventListener('wheel', function (event) {
        if (event.ctrlKey || event.metaKey) {
          var iframes = api.reader.getCurrentView().getIframes();
          var pageIndex = iframes.indexOf(event.view.frameElement);
          event.preventDefault();
          api.reader.trigger(ReadiumSDK.Events.MOUSE_WHEEL, event, {index: pageIndex, count: iframes.length});
        }
      }, {passive: false});
    });

    plugin.enablePanMove = function () {
      plugin.panMoveDisabled = false;
    };

    plugin.disablePanMove = function () {
      plugin.panMoveDisabled = true;
    };

    plugin.enableSwipe = function () {
      plugin.swipeDisabled = false;
    };

    plugin.disableSwipe = function () {
      plugin.swipeDisabled = true;
    };
  });

});

var onSwipe, onTap, onPinch, onPinchMove, onPanMove, onPress;

function setupHammer(context, Hammer, reader, iframe, element) {
  setGesturesHandler(reader, iframe);

  var hammertime = new Hammer(element, {
    cssProps: {
      userSelect: 'auto',
      touchSelect: 'auto'
    }
  });

  hammertime.get('swipe').set({threshold: 10, velocity: 0.3, direction: Hammer.DIRECTION_HORIZONTAL});
  hammertime.get('pinch').set({enable: true});
  hammertime.get('pan').set({threshold: 1});
  hammertime.get('tap').set({interval: 400, posThreshold: 100, threshold: 10});

  // set up the hammer gesture events swiping handlers
  hammertime.on('swipeleft', onSwipe.bind(context));
  hammertime.on('swiperight', onSwipe.bind(context));
  hammertime.on('tap', onTap);
  hammertime.on('pinchin', onPinch);
  hammertime.on('pinchout', onPinch);
  hammertime.on('panmove', onPanMove.bind(context));
  hammertime.on('press', onPress);

  return hammertime;
}

function setGesturesHandler(reader, window) {
  onSwipe = function (event) {
    if (this.swipeDisabled === true) {
      return;
    }
    if (window.getSelection().toString().length > 0) {
      return;
    }

    if (event.direction === Hammer.DIRECTION_LEFT) {
      reader.trigger(ReadiumSDK.Events.GESTURE_SWIPE_LEFT, event);
    } else if (event.direction === Hammer.DIRECTION_RIGHT) {
      reader.trigger(ReadiumSDK.Events.GESTURE_SWIPE_RIGHT, event);
    }
  };

  onTap = function (event) {
    if (event.target.hasAttribute('href') || (event.target.parentNode.hasAttribute && event.target.parentNode.hasAttribute('href'))) {
      //$(event.target).click();
    } else {
      reader.trigger(ReadiumSDK.Events.GESTURE_TAP, event);
    }
  };

  onPinchMove = function (event) {
    reader.trigger(ReadiumSDK.Events.GESTURE_PINCH_MOVE, event);
  };

  onPinch = function (event) {
    event.preventDefault();
    if (event.eventType === Hammer.INPUT_END) {
      reader.trigger(ReadiumSDK.Events.GESTURE_PINCH, event);
    } else if (event.eventType === Hammer.INPUT_MOVE) {
      onPinchMove(event);
    }
  };

  onPanMove = function (event) {
    if (this.panMoveDisabled === true) {
      return;
    }
    event.preventDefault();
    reader.moveInPage(-1 * event.deltaX, -1 * event.deltaY);
  };

  onPress = function (event) {
    reader.trigger(ReadiumSDK.Events.GESTURE_PRESS, event);
  };
}

function isGestureHandled(reader) {
  var viewType = reader.getCurrentViewType();

  // ReadiumSDK.Views.ReaderView.VIEW_TYPE_COLUMNIZED = 1
  // ReadiumSDK.Views.ReaderView.VIEW_TYPE_FIXED = 2
  return viewType === 1 || viewType === 2;
}
