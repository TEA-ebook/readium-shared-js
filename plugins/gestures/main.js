define(['readium_js_plugins', 'jquery', 'hammer'], function (Plugins, $, Hammer) {

  Plugins.register('gestures', function (api) {
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
      setupHammer(Hammer, api.reader, iframe, doc);

      // mouse events
      doc.addEventListener('mousemove', function (event) {
        api.reader.trigger(ReadiumSDK.Events.MOUSE_MOVE, event);
      }, false);
    });
  });

});

var onSwipe, onTap, onPinch, onPanMove, onPress;

function setupHammer(Hammer, reader, iframe, element) {
  setGesturesHandler(reader, iframe);

  var hammertime = new Hammer(element, {
    cssProps: {
      userSelect: 'auto',
      touchSelect: 'auto'
    }
  });

  hammertime.get('swipe').set({ threshold: 10, velocity: 0.3, direction: Hammer.DIRECTION_HORIZONTAL });
  hammertime.get('pinch').set({ enable: true });
  hammertime.get('pan').set({ threshold: 1 });
  hammertime.get('tap').set({ interval: 400, posThreshold: 100, threshold: 10 });

  // set up the hammer gesture events swiping handlers
  hammertime.on('swipeleft', onSwipe);
  hammertime.on('swiperight', onSwipe);
  hammertime.on('tap', onTap);
  hammertime.on('pinchin', onPinch);
  hammertime.on('pinchout', onPinch);
  hammertime.on('panmove', onPanMove);
  hammertime.on('press', onPress);

  return hammertime;
}

function setGesturesHandler(reader, window) {
  onSwipe = function (event) {
    if (event.direction === Hammer.DIRECTION_LEFT) {
      reader.trigger(ReadiumSDK.Events.GESTURE_SWIPE_LEFT, event);
    } else if (event.direction === Hammer.DIRECTION_RIGHT) {
      reader.trigger(ReadiumSDK.Events.GESTURE_SWIPE_RIGHT, event);
    }
  };

  onTap = function (event) {
    if (event.target.hasAttribute('href') || (event.target.parentNode.hasAttribute && event.target.parentNode.hasAttribute('href'))) {
      $(event.target).click();
    } else {
      if (event.tapCount === 2) {
        var textSelected = window.getSelection().toString();
        if (textSelected.length > 0) {
          reader.trigger(ReadiumSDK.Events.TEXT_SELECTED, event, textSelected);
        }
      }

      reader.trigger(ReadiumSDK.Events.GESTURE_TAP, event);
    }
  };

  onPinchMove = function (event) {
    reader.trigger(ReadiumSDK.Events.GESTURE_PINCH_MOVE, event);
  };

  onPinch = function (event) {
    if (event.eventType === Hammer.INPUT_END) {
      reader.trigger(ReadiumSDK.Events.GESTURE_PINCH, event);
    } else if (event.eventType === Hammer.INPUT_MOVE) {
      onPinchMove(event);
    }
  };

  onPanMove = function (event) {
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
