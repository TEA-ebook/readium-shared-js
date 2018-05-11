//  Created by Dmitry Markushevich (dmitrym@evidentpoint.com)
//
//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without modification,
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice,
//  this list of conditions and the following disclaimer in the documentation and/or
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be
//  used to endorse or promote products derived from this software without specific
//  prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
//  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
//  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
//  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
//  OF THE POSSIBILITY OF SUCH DAMAGE.

define(['jquery', 'underscore', 'eventEmitter', 'readium_shared_js/models/bookmark_data'], function($, _, EventEmitter) {

var defaultContext = {};

//determine if browser is IE9 or IE10
var div = document.createElement("div");
div.innerHTML = "<!--[if IE 9]><i></i><![endif]-->";
defaultContext.isIe9 = (div.getElementsByTagName("i").length == 1);
// IE10 introduced a prefixed version of PointerEvent, but not unprefixed.
defaultContext.isIe10 = window.MSPointerEvent && !window.PointerEvent;

/**
 *
 * @param proxyObj
 * @param options
 * @constructor
 */
var SearchManager = function (proxyObj, options) {

    var self = this;

    this.FindAllOccurencesOfStringForElement = function(element,keyword) {
      if (element) {
        if (element.nodeType == 3) {        // Text node
          while (true) {
            var value = element.nodeValue;  // Search for keyword in text node
            var idx = value.toLowerCase().indexOf(keyword);

            if (idx < 0) break;             // not found, abort

            window.alert("found = "+idx);
          }
        } else if (element.nodeType == 1) { // Element node
          if (element.style.display != "none" && element.nodeName.toLowerCase() != 'select') {
            for (var i=element.childNodes.length-1; i>=0; i--) {
              this.HighlightAllOccurencesOfStringForElement(element.childNodes[i],keyword);
            }
          }
        }
      }
    };

    this.FindAllOccurencesOfString = function(keyword) {
      this.FindAllOccurencesOfStringForElement(document.body, keyword);
    };
};

return SearchManager;
});
