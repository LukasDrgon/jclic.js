/**
 *  File    : Utils.js
 *  Created : 01/04/2015
 *  By      : Francesc Busquets <francesc@gmail.com>
 *
 *  JClic.js
 *  An HTML5 player of JClic activities
 *  https://projectestac.github.io/jclic.js
 *
 *  @source https://github.com/projectestac/jclic.js
 *
 *  @license EUPL-1.1
 *  @licstart
 *  (c) 2000-2016 Catalan Educational Telematic Network (XTEC)
 *
 *  Licensed under the EUPL, Version 1.1 or -as soon they will be approved by
 *  the European Commission- subsequent versions of the EUPL (the "Licence");
 *  You may not use this work except in compliance with the Licence.
 *
 *  You may obtain a copy of the Licence at:
 *  https://joinup.ec.europa.eu/software/page/eupl
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the Licence is distributed on an "AS IS" basis, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  Licence for the specific language governing permissions and limitations
 *  under the Licence.
 *  @licend
 */

/* global define */

define([
  "jquery",
  "screenfull",
  "es6-promise",
  "clipboard-js",
  "i18next",
  "jszip",
  "jszip-utils",
  "scriptjs",
  "webfontloader"
], function ($, screenfull, es6p, clipboard, i18next, JSZip, JSZipUtils, ScriptJS, WebFont) {

  // In some cases, require.js does not return a valid value for screenfull. Check it:
  if (!screenfull)
    screenfull = window.screenfull;

  // Use es6-promise for browsers without native support of 'Promise'
  var Promise = es6p.Promise;

  /**
   *
   * Miscellaneous utility functions and constants
   * @exports Utils
   * @class
   * @abstract
   */
  var Utils = {
    /**
     * Exports third-party NPM packages used by JClic, so they become available to other scripts through
     * the global variable `JClicObject` (defined in {@link JClic})
     * @example <caption>Example usage of JSZip through JClicObject</caption>
     * var WebFont = JClicObject.Utils.pkg.WebFont;
     * WebFont.load({google: {families: ['Roboto']}});
     * @type: {object} */
    pkg: {
      ClipboardJS: clipboard,
      Promise: Promise,
      i18next: i18next,
      $: $,
      JSZip: JSZip,
      JSZipUtils: JSZipUtils,
      ScriptJS: ScriptJS,
      WebFont: WebFont
    },
    /**
     * The "Promise" object obtained form es6-promise
     * @type: {function} */
    Promise: Promise,
    /**
     * Function obtained from `i18next` that will return the translation of the provided key
     * into the current language.
     * The real function will be initiated by the constructor of `JClicPlayer`. Meanwhile, it returns always `key`.
     * @param {string} key - ID of the expression to be translated
     * @returns {string} - Translated text
     */
    getMsg: function (key) {
      return key;
    },
    /**
     * List of valid verbosity levels
     * @const {string[]} */
    LOG_LEVELS: ['none', 'error', 'warn', 'info', 'debug', 'trace', 'all'],
    /**
     * Labels printed on logs for each message type
     * @const {string[]}
     */
    LOG_PRINT_LABELS: ['     ', 'ERROR', 'WARN ', 'INFO ', 'DEBUG', 'TRACE', 'ALL  '],
    /**
     * Current verbosity level. Default is 2 (only error and warning messages are printed)
     * @type {number} */
    LOG_LEVEL: 2, // warn
    /**
     * Options of the logging system
     * @type {object} */
    LOG_OPTIONS: {
      prefix: 'JClic',
      timestamp: true,
      popupOnErrors: false,
      chainTo: null,
      pipeTo: null
    },
    /**
     * Initializes the global settings
     * @param {object} options - An object with global settings
     * @returns {object} The normalized `options` object
     */
    init: function (options) {
      options = Utils.normalizeObject(options);
      if (typeof options.logLevel !== 'undefined')
        Utils.setLogLevel(options.logLevel);
      if (typeof options.chainLogTo === 'function')
        Utils.LOG_OPTIONS.chainTo = options.chainLogTo;
      if (typeof options.pipeLogTo === 'function')
        Utils.LOG_OPTIONS.pipeTo = options.pipeLogTo;
      return options;
    },
    /**
     * Establishes the current verbosity level of the logging system
     * @param {string} level - One of the valid strings in {@link Utils.LOG_LEVELS}
     */
    setLogLevel: function (level) {
      var log = Utils.LOG_LEVELS.indexOf(level);
      if (log >= 0)
        Utils.LOG_LEVEL = log;
    },
    /**
     * Reports a new message to the logging system
     * @param {string} type - The type of message. Mus be `error`, `warn`, `info`, `debug` or `trace`.
     * @param {string} msg - The main message to be logged. Additional parameters can be added, like
     * in `console.log` (see: {@link https://developer.mozilla.org/en-US/docs/Web/API/Console/log})
     */
    log: function (type, msg) {
      var level = Utils.LOG_LEVELS.indexOf(type);

      // Check if message should currently be logged
      if (level < 0 || level <= Utils.LOG_LEVEL) {
        if (Utils.LOG_OPTIONS.pipeTo)
          Utils.LOG_OPTIONS.pipeTo.apply(null, arguments);
        else {
          var mainMsg = msg;
          if (Utils.LOG_OPTIONS.timestamp)
            mainMsg = Utils.getDateTime() + ' ' + mainMsg;
          mainMsg = Utils.LOG_PRINT_LABELS[level] + ' ' + mainMsg;
          if (Utils.LOG_OPTIONS.prefix)
            mainMsg = Utils.LOG_OPTIONS.prefix + ' ' + mainMsg;

          if (arguments.length > 2) {
            var args = [mainMsg];
            for (var p = 2; p < arguments.length; p++)
              args.push(arguments[p]);
            console[level === 1 ? 'error' : level === 2 ? 'warn' : 'log'].apply(console, args);
          } else
            switch (level) {
              case 1:
                console.error(mainMsg);
                break;
              case 2:
                console.warn(mainMsg);
                break;
              default:
                console.log(mainMsg);
            }

          // Call chained logger, if anny
          if (Utils.LOG_OPTIONS.chainTo)
            Utils.LOG_OPTIONS.chainTo.apply(null, arguments);
        }
      }
    },
    /**
     * Gets a boolean value from a textual expression
     * @param {string} val - The value to be parsed (`true` for true, null or otherwise for `false`)
     * @param {boolean=} [defaultValue=false] - The default value to return when `val` is false
     * @returns {number}
     */
    getBoolean: function (val, defaultValue) {
      return val === 'true' ? true : val === 'false' ? false : defaultValue;
    },
    /**
     * Gets a value from an given expression that can be `null`, `undefined` or empty string ('')
     * @param {?*} val - The expression to parse
     * @param {?*} defaultValue - The value to return when `val` is `null`, `''` or `undefined`
     * @returns {*}
     */
    getVal: function (val, defaultValue) {
      return val === '' || val === null || typeof val === 'undefined' ?
        defaultValue || null :
        val;
    },
    /**
     * Gets a number from a string or another number
     * @param {?*} val - The expression to parse
     * @param {number} defaultValue - The default value
     * @returns {number}
     */
    getNumber: function (val, defaultValue) {
      return Number(Utils.getVal(val, defaultValue));
    },
    /**
     * Gets the plain percent expression (without decimals) of the given value
     * @param {number} val - The value to be expressed as a percentile
     * @returns {string}
     */
    getPercent: function (val) {
      return Math.round(val * 100) + '%';
    },
    /**
     * Returns a given time in [00h 00'00"] format
     * @param {number} millis - Amount of milliseconds to be processed
     * @returns {string}
     */
    getHMStime: function (millis) {
      var d = new Date(millis);
      var h = d.getUTCHours(), m = d.getUTCMinutes(), s = d.getUTCSeconds();
      return (h ? h + 'h ' : '') + (h || m ? ('0' + m).slice(-2) + '\'' : '') + ('0' + s).slice(-2) + '"';
    },
    /**
     * Returns a formatted string with the provided date and time
     * @param {Date} date - The date to be formatted. When `null` or `undefined`, the current date will be used.
     * @returns {string}
     */
    getDateTime: function (date) {
      if (!date)
        date = new Date();
      return date.getFullYear() + '/' + ('0' + date.getMonth()).slice(-2) + '/' + ('0' + date.getDate()).slice(-2) + ' ' +
        ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
    },
    /** @const {number} */
    'FALSE': 0,
    /** @const {number} */
    'TRUE': 1,
    /** @const {number} */
    'DEFAULT': 2,
    /**
     * Gets a numeric value (0, 1 or 2) from a set of possible values: `false`, `true` and `default`.
     * @param {?string} val - The text to be parsed
     * @returns {number}
     */
    getTriState: function (val) {
      return Number(val === 'true' ? Utils.TRUE
        : val === 'false' ? Utils.FALSE : Utils.DEFAULT);
    },
    /**
     * Returns a string with the given `tag` repeated n times
     * @param {string} tag - The tag to be repeated
     * @param {number} repeats - The number of times to repeat the tag
     * @returns {string}
     */
    fillString: function (tag, repeats) {
      var s = '';
      for (var i = 0; i < repeats; i++)
        s += tag;
      return s;
    },
    /**
     * Checks if the provided value is 'null' or 'undefined'.
     * @param {*} val - The value to be parsed
     * @returns {boolean}
     */
    isNullOrUndef: function (val) {
      return typeof val === 'undefined' || val === null;
    },
    /**
     * Checks if two expressions are equivalent.
     * Returns `true` when both parameters are `null` or `undefined`, and also when both have
     * equivalent values.
     * @param {!*} a
     * @param {!*} b
     * @returns {boolean}
     */
    isEquivalent: function (a, b) {
      return (typeof a === 'undefined' || a === null) && (typeof b === 'undefined' || b === null) ||
        a === b;
    },
    /**
     * Reads paragraphs, identified by `<p></p>` elements, inside XML data
     * @param {object} xml - The DOM-XML element to be parsed
     * @returns {string}
     */
    getXmlText: function (xml) {
      var text = '';
      $(xml).children('p').each(function () {
        text += '<p>' + this.textContent + '</p>';
      });
      return text;
    },
    /**
     * Creates a string suitable to be used in the 'style' attribute of HTML tags, filled with the
     * CSS attributes contained in the provided object.
     * @param {object} cssObj
     * @returns {string}
     */
    cssToString: function (cssObj) {
      var s = '';
      $.each(cssObj, function (key, value) {
        s += key + ': ' + value + ';';
      });
      return s;
    },
    /**
     * Converts java-like color codes (like '0xRRGGBB') to valid CSS values like '#RRGGBB' or 'rgba(r,g,b,a)'
     * @param {string=} color - A color, as codified in Java
     * @param {string=} defaultColor - The default color to be used
     * @returns {string}
     */
    checkColor: function (color, defaultColor) {

      if (typeof color === 'undefined' || color === null) {
        color = defaultColor;
        if (typeof color === 'undefined' || color === null)
          color = Utils.settings.BoxBase.BACK_COLOR;
      }

      var col = color.replace('0x', '#');

      // Check for Alpha value
      if (col.charAt(0) === '#' && col.length > 7) {
        var alpha = parseInt(col.substring(1, 3), 16) / 255.0;
        col = 'rgba(' +
          parseInt(col.substring(3, 5), 16) + ',' +
          parseInt(col.substring(5, 7), 16) + ',' +
          parseInt(col.substring(7, 9), 16) + ',' +
          alpha + ')';
      }
      return col;
    },
    /**
     * Checks if the provided color has an alpha value less than 1
     * @param {string} color - The color to be analyzed
     * @returns {boolean}
     */
    colorHasTransparency: function (color) {
      var result = false;
      if (Utils.startsWith(color, 'rgba(')) {
        var p = color.lastIndexOf(',');
        var alpha = parseInt(color.substr(p));
        result = typeof alpha === 'number' && alpha < 1.0;
      }
      return result;
    },
    /**
     * Clones the provided object
     * @param {object} obj
     * @returns {object}
     */
    cloneObject: function (obj) {
      return $.extend(true, {}, obj);
    },
    /**
     * Converts string values to number or boolean when needed
     * @param {Object} obj - The object to be processed
     * @returns {Object} - A new object with normalized content
     */
    normalizeObject: function (obj) {
      var result = {};
      if (obj)
        $.each(obj, function (key, value) {
          var s;
          if (typeof value === 'string' && (s = value.trim().toLowerCase()) !== '') {
            value = s === 'true' ? true : s === 'false' ? false : isNaN(s) ? value : Number(s);
          }
          result[key] = value;
        });
      return result;
    },
    /**
     * Check if the given char is a separator
     * @param {string} ch - A string with a single character
     * @returns {boolean}
     */
    isSeparator: function (ch) {
      return ' .,;-|'.indexOf(ch) >= 0;
    },
    /**
     * Rounds `v` to the nearest multiple of `n`
     * @param {number} v
     * @param {number} n - Cannot be zero!
     * @returns {number}
     */
    roundTo: function (v, n) {
      return Math.round(v / n) * n;
    },
    /**
     * Compares the provided answer against multiple valid options. These valid options are
     * concatenated in a string, separated by pipe chars (`|`). The comparing can be case sensitive.
     * @param {string} answer - The text to check against to
     * @param {string} check - String containing one or multiple options, separated by `|`
     * @param {boolean} checkCase - When true, the comparing will be case-sensitive
     * @returns {boolean}
     */
    compareMultipleOptions: function (answer, check, checkCase) {
      if (answer === null || answer.length === 0 || check === null || check.length === 0)
        return false;

      if (!checkCase)
        answer = answer.toUpperCase();

      answer = answer.trim();

      var tokens = check.split('|');
      for (var i = 0; i < tokens.length; i++) {
        var s = checkCase ? tokens[i] : tokens[i].toUpperCase();
        if (s.trim() === answer)
          return true;
      }
      return false;
    },
    /**
     * Checks if the given string ends with the specified expression
     * @param {string} text - The string where to find the expression
     * @param {string} expr - The expression to search for. It will not be checked against `undefined` or `null`.
     * @param {boolean=} trim - When `true`, the `text` string will be trimmed before check
     * @returns {boolean}
     */
    endsWith: function (text, expr, trim) {
      var result = false;
      if (typeof text !== 'undefined' && text !== null) {
        if (trim && text !== null)
          text = text.trim();
        result = text.indexOf(expr, text.length - expr.length) !== -1;
      }
      return result;
    },
    /**
     * Checks if the given string starts with the specified expression
     * @param {string} text - The string where to find the expression
     * @param {string} expr - The expression to search for. It will not be checked against `undefined` or `null`.
     * @param {boolean=} trim - When `true`, the `text` string will be trimmed before check
     * @returns {boolean}
     */
    startsWith: function (text, expr, trim) {
      var result = false;
      if (typeof text !== 'undefined' && text !== null) {
        if (trim && text !== null)
          text = text.trim();
        result = text.indexOf(expr) === 0;
      }
      return result;
    },
    /**
     * Replaces all occurrences of the backslash character (`\`) by a regular slash (`/`)
     * This is useful to normalize bad path names present in some old JClic projects
     * @param {String} str - The string to be normalized
     * @returns {string}
     */
    nSlash: function (str) {
      return str ? str.replace(/\\/g, '/') : str;
    },
    /**
     * Checks if the given expression is an absolute URL
     * @param {string} exp - The expression to be checked
     * @returns {boolean}
     */
    isURL: function (exp) {
      var path = /^(filesystem:)?(https?|file|data|ftps?):/i;
      return path.test(exp);
    },
    /**
     * Gets the base path of the given file path (absolute or full URL). This base path always ends
     * with `/`, meaning it can be concatenated with relative paths without adding a separator.
     * @param {type} path - The full path to be parsed
     * @returns {string}
     */
    getBasePath: function (path) {
      var result = '';
      var p = path.lastIndexOf('/');
      if (p >= 0)
        result = path.substring(0, p + 1);
      return result;
    },
    /**
     * Gets the full path of `file` relative to `basePath`
     * @param {string} file - The file name
     * @param {string=} path - The base path
     * @returns {string}
     */
    getRelativePath: function (file, path) {
      if (!path || path === '' || file.indexOf(path) !== 0)
        return file;
      else
        return file.substr(path.length);
    },
    /**
     * Gets the complete path of a relative or absolute URL, using the provided `basePath`
     * @param {string} basePath - The base URL
     * @param {string} path - The filename
     * @returns {string}
     */
    getPath: function (basePath, path) {
      return Utils.isURL(path) ? path : basePath + path;
    },
    /**
     * Gets a promise with the complete path of a relative or absolute URL, using the provided `basePath`
     * @param {string} basePath - The base URL
     * @param {string} path - The filename
     * @param {?external:JSZip} zip - An optional {@link external:JSZip} object where to look
     * for the file
     * @returns {external:Promise}
     */
    getPathPromise: function (basePath, path, zip) {
      if (zip) {
        var fName = Utils.getRelativePath(basePath + path, zip.zipBasePath);
        if (zip.files[fName]) {
          return new Promise(function (resolve, reject) {
            zip.file(fName).async('base64').then(function (data) {
              var ext = path.toLowerCase().split('.').pop();
              var mime = Utils.settings.MIME_TYPES[ext];
              if (!mime)
                mime = 'application/octet-stream';
              resolve('data:' + mime + ';base64,' + data);
            }).catch(reject);
          });
        }
      }
      return Promise.resolve(Utils.getPath(basePath, path));
    },
    /**
     * Utility object that provides several methods to build simple and complex DOM objects
     * @type {object}
     */
    $HTML: {
      doubleCell: function (a, b) {
        return $('<tr/>').append($('<td/>').html(a)).append($('<td/>').html(b));
      },
      p: function (txt) {
        return $('<p/>').html(txt);
      },
      td: function (txt, className) {
        return $('<td/>', className ? { class: className } : null).html(txt);
      },
      th: function (txt, className) {
        return $('<th/>', className ? { class: className } : null).html(txt);
      }
    },
    /**
     * Checks if the current browser allows to put HTML elements in full screen mode
     * @returns {boolean}
     */
    screenFullAllowed: function () {
      return screenfull && screenfull.enabled;
    },
    /**
     * Replaces `width`, `height` and `fill` attributes of a simple SVG image
     * with the provided values
     * @param {string} svg - The SVG image as XML string
     * @param {string=} width - Optional setting for "width" property
     * @param {string=} height - Optional setting for "height" property
     * @param {string=} fill - Optional setting for "fill" property
     * @returns {string} - The resulting svg code
     */
    getSvg: function (svg, width, height, fill) {
      if (width)
        svg = svg.replace(/width=\"\d*\"/, 'width="' + width + '"');
      if (height)
        svg = svg.replace(/height=\"\d*\"/, 'height="' + height + '"');
      if (fill)
        svg = svg.replace(/fill=\"[#A-Za-z0-9]*\"/, 'fill="' + fill + '"');
      return svg;
    },
    /**
     * Encodes a svg expression into a {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs|data URI}
     * suitable for the `src` property of `img` elements, optionally changing its original size and fill values.
     * @param {string} svg - The SVG image as XML string
     * @param {string=} width - Optional setting for "width" property
     * @param {string=} height - Optional setting for "height" property
     * @param {string=} fill - Optional setting for "fill" property
     * @returns {string} - The resulting Data URI
     */
    svgToURI: function (svg, width, height, fill) {
      return 'data:image/svg+xml;base64,' + btoa(Utils.getSvg(svg, width, height, fill));
    },
    /**
     * Converts the given expression into a valid value for CSS size values
     * @param {string|number} exp - The expression to be evaluated (can be a valid value, `null` or `undefined`)
     * @param {Object} css - An optional Object where the resulting expression (if any) will be saved
     * @param {string} key - The key under which the result will be stored in `css`
     * @param {string} def - Default value to be used when `exp` is `null` or `undefined`
     * @returns {string} - A valid CSS value, or `null` if it can't be found. Default units are `px`
     */
    toCssSize: function (exp, css, key, def) {
      var result = typeof exp === 'undefined' || exp === null ? null : isNaN(exp) ? exp : exp + 'px';
      if (css && key && (result || def))
        css[key] = result !== null ? result : def;
      return result;
    },
    /**
     * Finds the nearest `head` or root node of a given HTMLElement, useful to place `<style/>` elements when
     * the main component of JClic is behind a shadow-root.
     * This method will be replaced by a call to [Node.getRootNode()](https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode)
     * when fully supported by all major browsers.
     * @param {Node=} el - The element from which to start the search
     * @returns {Node}
     */
    getRootHead: function (el) {
      if (el) {
        // Skip HTMLElements
        while (el.parentElement)
          el = el.parentElement;
        // Get the parent node of the last HTMLElement
        if (el instanceof HTMLElement)
          el = el.parentNode || el;
        // If the root node has a `head`, take it
        el = el['head'] || el;
      }
      el = el || document.head;
      return el;
    },
    /**
     * Appends a stylesheet element to the `head` or root node nearest to the given `HTMLElement`.
     * @param {String} css - The content of the stylesheet
     * @param {PlayStation=} ps - An optional `PlayStation` (currently a {@link JClicPlayer}) used as a base to find the root node
     * @returns {HTMLStyleElement} - The appended style element
     */
    appendStyleAtHead: function (css, ps) {
      var root = Utils.getRootHead(ps && ps.$topDiv ? ps.$topDiv[0] : null);
      var style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      return root.appendChild(style);
    },
    /**
     * Global constants
     * @const
     */
    settings: {
      // layout constants
      AB: 0, BA: 1, AUB: 2, BUA: 3,
      LAYOUT_NAMES: ['AB', 'BA', 'AUB', 'BUA'],
      DEFAULT_WIDTH: 400,
      DEFAULT_HEIGHT: 300,
      MINIMUM_WIDTH: 40,
      MINIMUM_HEIGHT: 40,
      DEFAULT_NAME: '---',
      DEFAULT_MARGIN: 8,
      DEFAULT_SHUFFLES: 31,
      DEFAULT_GRID_ELEMENT_SIZE: 20,
      MIN_CELL_SIZE: 10,
      //DEFAULT_BG_COLOR: '#D3D3D3', // LightGray
      DEFAULT_BG_COLOR: '#C0C0C0', // LightGray
      ACTIONS: {
        ACTION_MATCH: 'MATCH', ACTION_PLACE: 'PLACE',
        ACTION_WRITE: 'WRITE', ACTION_SELECT: 'SELECT', ACTION_HELP: 'HELP'
      },
      PREVIOUS: 0, MAIN: 1, END: 2, END_ERROR: 3, NUM_MSG: 4,
      MSG_TYPE: ['previous', 'initial', 'final', 'finalError'],
      RANDOM_CHARS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      NUM_COUNTERS: 3,
      MAX_RECORD_LENGTH: 20,
      // BoxBase defaults
      BoxBase: {
        REDUCE_FONT_STEP: 1.0,
        MIN_FONT_SIZE: 8,
        STROKE: 1,
        AC_MARGIN: 6,
        //BACK_COLOR: 'lightgray',
        BACK_COLOR: '#C0C0C0',
        TEXT_COLOR: 'black',
        SHADOW_COLOR: 'gray',
        INACTIVE_COLOR: 'gray',
        ALTERNATIVE_COLOR: 'gray',
        BORDER_COLOR: 'black',
        BORDER_STROKE_WIDTH: 0.75,
        MARKER_STROKE_WIDTH: 2.75
      },
      FILE_TYPES: {
        image: 'gif,jpg,png,jpeg,bmp,ico,svg',
        audio: 'wav,mp3,ogg,oga,au,aiff,flac',
        video: 'avi,mov,mpeg,mp4,ogv,m4v,webm',
        font: 'ttf,otf,eot,woff,woff2',
        midi: 'mid,midi',
        anim: 'swf',
        // Used in custom skins
        xml: 'xml'
      },
      MIME_TYPES: {
        xml: 'text/xml',
        gif: 'image/gif',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        bmp: 'image/bmp',
        svg: 'image/svg+xml',
        ico: 'image/x-icon',
        wav: 'audio/wav',
        mp3: 'audio/mpeg',
        mp4: 'video/mp4',
        m4v: 'video/mp4',
        ogg: 'audio/ogg',
        oga: 'audio/ogg',
        ogv: 'video/ogg',
        webm: 'video/webm',
        au: 'audio/basic',
        aiff: 'audio/x-aiff',
        flac: 'audio/flac',
        avi: 'video/avi',
        mov: 'video/quicktime',
        mpeg: 'video/mpeg',
        ttf: 'application/font-sfnt',
        otf: 'application/font-sfnt',
        eot: ' application/vnd.ms-fontobject',
        woff: 'application/font-woff',
        woff2: 'application/font-woff2',
        swf: 'application/x-shockwave-flash'
      },
      // Global settings susceptible to be modified
      COMPRESS_IMAGES: true,
      // Keyboard key codes
      VK: {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
      },
      // Flag to indicate that we are running on a touch device
      TOUCH_DEVICE: false,
      // Amount of time (in milliseconds) to wait before a media resource is loaded
      LOAD_TIMEOUT: 10000,
      // Number of points to be calculated as polygon vertexs when simplifying bezier curves
      BEZIER_POINTS: 4,
      // Check if canvas accessibility features are enabled
      // See: http://codepen.io/francesc/pen/amwvRp
      CANVAS_HITREGIONS: typeof CanvasRenderingContext2D !== 'undefined' && typeof CanvasRenderingContext2D.prototype.addHitRegion === 'function',
      CANVAS_HITREGIONS_FOCUS: typeof CanvasRenderingContext2D !== 'undefined' && typeof CanvasRenderingContext2D.prototype.drawFocusIfNeeded === 'function'
    },
    //
    // Functions useful to deal with caret position in `contentEditable` DOM elements
    //
    /**
     * Gets the caret position within the given element. Thanks to
     * {@link http://stackoverflow.com/users/96100/tim-down|Tim Down} answers in:
     * {@link http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container}
     * and {@link http://stackoverflow.com/questions/6240139/highlight-text-range-using-javascript/6242538}
     * @param {object} element - A DOM element
     * @returns {number}
     */
    getCaretCharacterOffsetWithin: function (element) {
      var caretOffset = 0;
      var doc = element.ownerDocument || element.document;
      var win = doc.defaultView || doc.parentWindow;
      var sel;
      if (typeof win.getSelection !== "undefined") {
        sel = win.getSelection();
        if (sel.rangeCount > 0) {
          var range = win.getSelection().getRangeAt(0);
          var preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(element);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          caretOffset = preCaretRange.toString().length;
        }
      } else if ((sel = doc.selection) && sel.type !== "Control") {
        var textRange = sel.createRange();
        var preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
      }
      return caretOffset;
    },
    /**
     * Utility function called by {@link Utils~getCaretCharacterOffsetWithin}
     * @param {object} node - A text node
     * @returns {object[]}
     */
    getTextNodesIn: function (node) {
      var textNodes = [];
      if (node.nodeType === 3) {
        textNodes.push(node);
      } else {
        var children = node.childNodes;
        for (var i = 0, len = children.length; i < len; ++i) {
          textNodes.push.apply(textNodes, Utils.getTextNodesIn(children[i]));
        }
      }
      return textNodes;
    },
    /**
     * Sets the selection range (or the cursor position, when `start` and `end` are the same) to a
     * specific position inside a DOM element.
     * @param {object} el - The DOM element where to set the cursor
     * @param {number} start - The start position of the selection (or cursor position)
     * @param {type} end - The end position of the selection. When null or identical to `start`,
     * indicates a cursor position.
     */
    setSelectionRange: function (el, start, end) {
      if (Utils.isNullOrUndef(end))
        end = start;
      if (document.createRange && window.getSelection) {
        var range = document.createRange();
        range.selectNodeContents(el);
        var textNodes = Utils.getTextNodesIn(el);
        var foundStart = false;
        var charCount = 0, endCharCount, textNode;

        for (var i = 0; i < textNodes.length; i++) {
          textNode = textNodes[i];
          endCharCount = charCount + textNode.length;
          if (!foundStart && start >= charCount &&
            (start < endCharCount ||
              start === endCharCount && i + 1 <= textNodes.length)) {
            range.setStart(textNode, start - charCount);
            foundStart = true;
          }
          if (foundStart && end <= endCharCount) {
            range.setEnd(textNode, end - charCount);
            break;
          }
          charCount = endCharCount;
        }
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (document.selection && document.body.createTextRange) {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(true);
        textRange.moveEnd("character", end);
        textRange.moveStart("character", start);
        textRange.select();
      }
    }
  };

  return Utils;
});
