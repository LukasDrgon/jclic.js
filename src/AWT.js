/**
 *  File    : AWT.js
 *  Created : 12/04/2015
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
  "./Utils",
  "webfontloader"
], function ($, Utils, WebFont) {

  /**
   * This object contains utility clases for painting graphics and images,
   * as found in the Java [Abstract Window Toolkit](http://docs.oracle.com/javase/7/docs/api/java/awt/package-summary.html)
   *
   * The objects defined here are: {@link AWT.Font}, {@link AWT.Gradient}, {@link AWT.Stroke},
   * {@link AWT.Point}, {@link AWT.Dimension}, {@link AWT.Shape}, {@link AWT.Rectangle},
   * {@link AWT.Ellipse}, {@link AWT.Path}, {@link AWT.PathStroke}, {@link AWT.Action},
   * {@link AWT.Timer} and {@link AWT.Container}.
   * @exports AWT
   * @class
   * @abstract
   */
  var AWT = {};

  /**
   * AWT.Font contains properties and provides methods to manage fonts
   * @class
   * @param {string=} [family='Arial']
   * @param {number=} [size=17]
   * @param {number=} [bold=0]
   * @param {number=} [italic=0]
   * @param {string=} [variant='']
   */
  AWT.Font = function (family, size, bold, italic, variant) {
    if (family)
      this.family = family;
    if (typeof size === 'number')
      this.size = size;
    if (bold)
      this.bold = bold;
    if (italic)
      this.italic = italic;
    if (variant)
      this.variant = variant;
    this._metrics = { ascent: -1, descent: -1, height: -1 };
  };

  /**
   * Array of font objects with already calculated heights */
  AWT.Font.ALREADY_CALCULATED_FONTS = [];

  /**
   * Google Fonts equivalent for special fonts used in some JClic projects.
   * More substitutions can be added to the list for specific projects indicating a
   * `fontSubstitutions` object in the `data-options` attribute of the HTML `div` element
   * containing the player.
   * For example:
   * `<div class ="JClic" data-project="demo.jclic" data-options='{"fontSubstitutions":{"arial":"Arimo"}}'/>`
   */
  AWT.Font.SUBSTITUTIONS = {
    'abc': 'Kalam',
    'a.c.m.e. secret agent': 'Permanent Marker',
    'comic sans ms': 'Patrick Hand',
    'impact': 'Oswald',
    'massallera': 'Vibur',
    'memima': 'Vibur',
    'memima_n1': 'Vibur',
    'memima_n2': 'Vibur',
    'memimas-regularalternate': 'Vibur',
    'palmemim': 'Vibur',
    'zurichcalligraphic': 'Felipa'
  };

  /**
   * Array of font names already loaded from Google Fonts */
  AWT.Font.ALREADY_LOADED_FONTS = [];

  /**
   * Finds the XML elements with typeface specifications, checks its value against the font
   * substitution list, replacing the `family` attribute and loading the alternative font when needed.
   * @param {external:jQuery} $tree - The xml element to be processed
   * @param {Object=} options - Optional param that can contain a `fontSubstitutions` attribute with
   * a substition table to be added to {@link AWT.Font.SUBSTITUTIONS}
   */
  AWT.Font.checkTree = function ($tree, options) {

    var substitutions = AWT.Font.SUBSTITUTIONS;

    // Load own fonts and remove it from the substitution table
    if (options && options.ownFonts) {
      options.ownFonts.forEach(function (name) {
        // Check WebFont as a workaround to avoid problems with a different version of `webfontloader` in agora.xtec.cat
        if (AWT.Font.ALREADY_LOADED_FONTS.indexOf(name) < 0 && WebFont && WebFont.load) {
          WebFont.load({ custom: { families: [name] } });
          AWT.Font.ALREADY_LOADED_FONTS.push(name);
          delete substitutions[name.trim().toLowerCase()];
        }
      });
    }

    // Add custom font substitutions
    if (options && options.fontSubstitutions)
      substitutions = $.extend(Object.create(substitutions), options.fontSubstitutions);

    $tree.find('style[family],font[family]').each(function () {
      var $this = $(this);
      var name = $this.attr('family').trim().toLowerCase();
      if (name in substitutions) {
        var newName = substitutions[name];
        if (newName !== '') {
          AWT.Font.loadGoogleFont(newName);
          $this.attr('family', newName);
        }
      }
    });
  };

  /**
   * Try to load a specific font from [http://www.google.com/fonts]
   * @param {string} name - The font family name
   */
  AWT.Font.loadGoogleFont = function (name) {
    // Check WebFont as a workaround to avoid problems with a different version of `webfontloader` in agora.xtec.cat
    if (name && AWT.Font.ALREADY_LOADED_FONTS.indexOf(name) < 0 && WebFont && WebFont.load) {
      WebFont.load({ google: { families: [name] } });
      AWT.Font.ALREADY_LOADED_FONTS.push(name);
    }
  };

  /**
   * Try to load a set of Google fonts
   * @param {string[]} fonts - An array of font names
   */
  AWT.Font.loadGoogleFonts = function (fonts) {
    if (fonts)
      for (var p = 0; p < fonts.length; p++)
        AWT.Font.loadGoogleFont(fonts[p]);
  };

  AWT.Font.prototype = {
    constructor: AWT.Font,
    /**
     * The `font-family` property
     * @type {string} */
    family: 'Arial',
    /**
     * The font size
     * __Warning__: Do not change `size` directly. Use the {@link AWT.Font#setSize|setSize()}
     * method instead.
     * @type {number} */
    size: 17,
    /**
     * The font _bold_ value
     * @type {number} */
    bold: 0,
    /**
     * The font _italic_ value
     * @type {number} */
    italic: 0,
    /**
     * The font _variant_ value
     * @type {string}*/
    variant: '',
    /**
     * The font *_metrics* property contains the values for `ascent`, `descent` and `height`
     * attributes. Vertical font metrics are calculated in
     * {@link AWT.Font#_calcHeight|calcHeight()} as needed.
     * @type {{ascent: number, descent: number, height: number}} */
    _metrics: { ascent: -1, descent: -1, height: -1 },
    /**
     *
     * Reads the properties of this Font from an XML element
     * @param {external:jQuery} $xml - The xml element to be parsed
     * @returns {AWT.Font}
     */
    setProperties: function ($xml) {
      if ($xml.attr('family'))
        this.family = $xml.attr('family');
      if ($xml.attr('size'))
        this.size = Number($xml.attr('size'));
      if ($xml.attr('bold'))
        this.bold = Utils.getBoolean($xml.attr('bold'));
      if ($xml.attr('italic'))
        this.italic = Utils.getBoolean($xml.attr('italic'));
      if ($xml.attr('variant'))
        this.variant = $xml.attr('variant');
      return this;
    },
    /**
     *
     * Allows to change the `size` member, recalculating the vertical metrics.
     * @param {number} size - The new size to set
     * @returns {AWT.Font}
     */
    setSize: function (size) {
      var currentSize = this.size;
      this.size = size;
      if (currentSize !== size)
        this._metrics.height = -1;
      return this;
    },
    /**
     * 
     * Increases or decreases the current font size by the specified amount
     * @param {number} amount - The amount to increase or decrease current size
     * @returns {AWT.Font}
     */
    zoom: function (amount) {
      return this.setSize(this.size + amount);
    },
    /**
     *
     * Calculates the vertical font metrics and returns its height
     * @returns {number} - The font height
     */
    getHeight: function () {
      if (this._metrics.height < 0) {
        // Look for an equivalent font already calculated
        for (var i = 0; i < AWT.Font.ALREADY_CALCULATED_FONTS.length; i++) {
          var font = AWT.Font.ALREADY_CALCULATED_FONTS[i];
          if (font.equals(this)) {
            this._metrics.height = font._metrics.height;
            this._metrics.ascent = font._metrics.ascent;
            this._metrics.descent = font._metrics.descent;
            break;
          }
        }
        if (this._metrics.height < 0) {
          this._calcHeight();
          if (this._metrics.height > 0)
            AWT.Font.ALREADY_CALCULATED_FONTS.push(this);
        }
      }
      return this._metrics.height;
    },
    /**
     *
     * Translates the Font properties into CSS statements
     * @param {Object} css - The object where to add CSS properties. When null or undefined, a new
     * object will be created and returned.
     * @returns {Object} - A set of CSS property-values pairs, ready to be used in JQuery
     * [.css(properties)](http://api.jquery.com/css/#css-properties) function.
     */
    toCss: function (css) {
      if (!css)
        css = {};
      css['font-family'] = this.family;
      css['font-size'] = this.size + 'px';
      if (this.hasOwnProperty('bold'))
        css['font-weight'] = this.bold ? 'bold' : 'normal';
      if (this.hasOwnProperty('italic'))
        css['font-style'] = this.italic ? 'italic' : 'normal';
      if (this.hasOwnProperty('variant'))
        css['font-variant'] = this.variant;
      return css;
    },
    /**
     *
     * Gets the codification of this font in a single string, suitable to be used in a `font`
     * CSS attribute.
     * @returns {String} - A string with all the CSS font properties concatenated
     */
    cssFont: function () {
      return (this.italic ? 'italic ' : 'normal') + ' ' +
        (this.variant === '' ? 'normal' : this.variant) + ' ' +
        (this.bold ? 'bold ' : 'normal') + ' ' +
        this.size + 'pt ' +
        this.family;
    },
    /**
     *
     * The {@link https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics TextMetrics} object used
     * by {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D CanvasRenderingContext2D}
     * does not provide a `heigth` value for rendered text.
     * This {@link http://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas stackoverflow question}
     * has an excellent response by Daniel Earwicker explaining how to measure the
     * vertical dimension of rendered text using a `span` element.
     * The code has been slighty adapted to deal with Font objects.
     *
     * _Warning_: Do not call this method direcly. Use {@link AWT.Font#getHeight getHeight()} instead
     * 
     * @returns {AWT.Font}
     */
    _calcHeight: function () {
      var $text = $('<span/>').html('Hg').css(this.toCss());
      var $block = $('<div/>').css({ display: 'inline-block', width: '1px', height: '0px' });
      var $div = $('<div/>').append($text, $block);
      $('body').append($div);
      try {
        $block.css({ verticalAlign: 'baseline' });
        this._metrics.ascent = $block.offset().top - $text.offset().top;
        $block.css({ verticalAlign: 'bottom' });
        this._metrics.height = $block.offset().top - $text.offset().top;
        this._metrics.descent = this._metrics.height - this._metrics.ascent;
      } finally {
        $div.remove();
      }
      return this;
    },
    /**
     *
     * Checks if two Font objects are equivalent
     * @param {AWT#Font} font - The AWT.Font object to compare against this one
     * @returns {Boolean} - `true` if both objects are equivalent, `false` otherwise
     */
    equals: function (font) {
      return this.family === font.family &&
        this.size === font.size &&
        this.bold === font.bold &&
        this.italic === font.italic &&
        this.variant === font.variant;
    }
  };

  /**
   * Contains parameters and methods to draw complex color gradients
   * @class
   * @param {string} c1 - The initial color, in any CSS-valid form.
   * @param {string} c2 - The final color, in any CSS-valid form.
   * @param {number=} [angle=0] - The inclination of the gradient relative to the horizontal line.
   * @param {number=} [cycles=1] - The number of times the gradient will be repeated.
   */
  AWT.Gradient = function (c1, c2, angle, cycles) {
    if (c1)
      this.c1 = c1;
    if (c2)
      this.c2 = c2;
    if (typeof angle === 'number')
      this.angle = angle % 360;
    if (typeof cycles === 'number')
      this.cycles = cycles;
  };

  AWT.Gradient.prototype = {
    constructor: AWT.Gradient,
    /**
     * Initial color
     * @type {string} */
    c1: 'white',
    /**
     * Final color
     * @type {string} */
    c2: 'black',
    /**
     * Tilt angle
     * @type {number} */
    angle: 0,
    /**
     * Number of repetitions of the gradient
     * @type {number} */
    cycles: 1,
    /**
     *
     * Reads the properties of this Gradient from an XML element
     * @param {external:jQuery} $xml - The xml element to be parsed
     * @returns {AWT.Gradient}
     */
    setProperties: function ($xml) {
      this.c1 = Utils.checkColor($xml.attr('source'), 'black');
      this.c2 = Utils.checkColor($xml.attr('dest'), 'white');
      this.angle = Number($xml.attr('angle') || 0) % 360;
      this.cycles = Number($xml.attr('cycles') || 1);
      return this;
    },
    /**
     *
     * Creates a {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient|CanvasGradient}
     * based on the provided context and rectangle.
     * @param {external:CanvasRenderingContext2D} ctx - The 2D rendering context
     * @param {AWT.Rectangle} rect - The rectangle where this gradient will be applied to
     * @returns {AWT.Gradient}
     */
    getGradient: function (ctx, rect) {
      var p2 = rect.getOppositeVertex();
      var gradient = ctx.createLinearGradient(rect.pos.x, rect.pos.y, p2.x, p2.y);
      var step = 1 / Math.max(this.cycles, 1);
      for (var i = 0; i <= this.cycles; i++)
        gradient.addColorStop(i * step, i % 2 ? this.c1 : this.c2);
      return gradient;
    },
    /**
     *
     * Gets the CSS 'linear-gradient' expression of this Gradient
     * @returns {string} - A string ready to be used as a value for the `linear-gradient` CSS attribute
     */
    getCss: function () {
      var result = 'linear-gradient(' +
        (this.angle + 90) + 'deg, ' +
        this.c1 + ', ' +
        this.c2;
      for (var i = 1; i < this.cycles; i++) {
        result += ', ' + (i % 2 > 0 ? this.c1 : this.c2);
      }
      result += ')';
      return result;
    },
    /**
     *
     * Checks if the gradient colors have transparency
     * @returns {boolean} - `true` if this gradient uses colors with transparency, `false` otherwise.
     */
    hasTransparency: function () {
      return Utils.colorHasTransparency(this.c1) || Utils.colorHasTransparency(this.c2);
    }
  };

  /**
   * Contains properties used to draw lines in HTML `canvas` elements.
   * @see {@link http://bucephalus.org/text/CanvasHandbook/CanvasHandbook.html#line-caps-and-joins}
   * @class
   * @param {number=} [lineWidth=1] - The line width of the stroke
   * @param {string=} [lineCap='butt'] - The line ending type. Possible values are: `butt`, `round`
   * and `square`.
   * @param {string=} [lineJoin='miter'] - The type of drawing used when two lines join. Possible
   * values are: `round`, `bevel` and `miter`.
   * @param {number=} [miterLimit=10] - The ratio between the miter length and half `lineWidth`.
   */
  AWT.Stroke = function (lineWidth, lineCap, lineJoin, miterLimit) {
    if (typeof lineWidth === 'number')
      this.lineWidth = lineWidth;
    if (lineCap)
      this.lineCap = lineCap;
    if (lineJoin)
      this.lineJoin = lineJoin;
    if (typeof miterLimit === 'number')
      this.miterLimit = miterLimit;
  };

  AWT.Stroke.prototype = {
    constructor: AWT.Stroke,
    /**
     * The line width
     * @type {number} */
    lineWidth: 1.0,
    /**
     * The line ending type (`butt`, `round` or `square`)
     * @type {string} */
    lineCap: 'butt',
    /**
     * The drawing used when two lines join (`round`, `bevel` or `miter`)
     * @type {string} */
    lineJoin: 'miter',
    /**
     * Ratio between the miter length and half `lineWidth`
     * @type {number} */
    miterLimit: 10.0,
    /**
     *
     * Sets the properties of this stroke to a CanvasRenderingContext2D
     * @param {external:CanvasRenderingContext2D} ctx - The canvas 2D rendering context
     * @returns {external:CanvasRenderingContext2D}
     */
    setStroke: function (ctx) {
      ctx.lineWidth = this.lineWidth;
      ctx.lineCap = this.lineCap;
      ctx.lineJoin = this.lineJoin;
      ctx.miterLimit = this.miterLimit;
      return ctx;
    }
  };

  /**
   *
   * Contains the `x` andy `y` coordinates of a point, and provides some useful methods.
   * @class
   * @param {number|AWT.Point} x - When `x` is an `AWT.Point` object, a clone of it will be created.
   * @param {number=} y - Not used when `x` is an `AWT.Point`
   */
  AWT.Point = function (x, y) {
    if (x instanceof AWT.Point) {
      // Special case: constructor passing another point as unique parameter
      this.x = x.x;
      this.y = x.y;
    } else {
      this.x = x || 0;
      this.y = y || 0;
    }
  };

  AWT.Point.prototype = {
    constructor: AWT.Point,
    /**
     * @type {number} */
    x: 0,
    /**
     * @type {number} */
    y: 0,
    /**
     *
     * Reads the properties of this Point from an XML element
     * @param {external:jQuery} $xml - The xml element to be parsed
     * @returns {AWT.Point}
     */
    setProperties: function ($xml) {
      this.x = Number($xml.attr('x'));
      this.y = Number($xml.attr('y'));
      return this;
    },
    /**
     *
     * Moves this Point to a new position, by a specified displacement
     * @param {AWT.Point|AWT.Dimension} delta - The amount to move
     * @returns {AWT.Point}
     */
    moveBy: function (delta) {
      this.x += delta.x || delta.width || 0;
      this.y += delta.y || delta.height || 0;
      return this;
    },
    /**
     *
     * Moves this Point to a new position
     * @param {number|AWT.Point} newPos - The new position, or a x coordinate
     * @param {number=} y - `null` or `undefined` when `newPos` is a Point
     * @returns {AWT.Point}
     */
    moveTo: function (newPos, y) {
      if (typeof newPos === 'number') {
        this.x = newPos;
        this.y = y;
      } else {
        this.x = newPos.x;
        this.y = newPos.y;
      }
      return this;
    },
    /**
     *
     * Multiplies the `x` and `y` coordinates by a specified `delta`
     * @param {AWT.Point|AWT.Dimension} delta - The amount to multiply by.
     * @returns {AWT.Point}
     */
    multBy: function (delta) {
      this.x *= delta.x || delta.width || 0;
      this.y *= delta.y || delta.height || 0;
      return this;
    },
    /**
     *
     * Checks if two points are the same
     * @param {AWT.Point} p - The Point to check against to
     * @returns {boolean}
     */
    equals: function (p) {
      return this.x === p.x && this.y === p.y;
    },
    /**
     *
     * Calculates the distance between two points
     * @param {AWT.Point} point - The Point to calculate the distance against to
     * @returns {number} - The distance between the two points.
     */
    distanceTo: function (point) {
      return Math.sqrt(Math.pow(this.x - point.x, 2), Math.pow(this.y - point.y, 2));
    },
    /**
     *
     * Clones this point
     * @returns {AWT.Point}
     */
    clone: function () {
      return new AWT.Point(this);
    }
  };

  /**
   * This class encapsulates `width` and `height` properties.
   * @class
   * @param {number|AWT.Point} w - The width of this Dimension, or the upper-left vertex of a
   * virtual Rectangle
   * @param {number|AWT.Point} h - The height of this Dimension, or the bottom-right vertex of a
   * virtual Rectangle
   */
  AWT.Dimension = function (w, h) {
    if (w instanceof AWT.Point && h instanceof AWT.Point) {
      this.width = h.x - w.x;
      this.height = h.y - w.y;
    } else {
      this.width = w || 0;
      this.height = h || 0;
    }
  };

  AWT.Dimension.prototype = {
    constructor: AWT.Dimension,
    /**
     * @type {number} */
    width: 0,
    /**
     * @type {number} */
    height: 0,
    /**
     *
     * Reads the properties of this Dimension from an XML element
     * @param {external:jQuery} $xml - The xml element to be parsed
     * @returns {AWT.Dimension}
     */
    setProperties: function ($xml) {
      this.width = Number($xml.attr('width'));
      this.height = Number($xml.attr('height'));
      return this;
    },
    /**
     *
     * Check if two dimensions are equivalent
     * @param {AWT.Dimension} d
     * @returns {Boolean}
     */
    equals: function (d) {
      return this.width === d.width && this.height === d.height;
    },
    /**
     *
     * Multiplies the `w` and `h` co-ordinates by a specified `delta`
     * @param {AWT.Point|AWT.Dimension} delta
     * @returns {AWT.Dimension}
     */
    multBy: function (delta) {
      this.width *= delta.x || delta.width || 0;
      this.height *= delta.y || delta.height || 0;
      return this;
    },
    /**
     *
     * Sets new values for width and height.
     * `width` can be a number or another `AWT.Dimension` object
     * @param {number|AWT.Dimension} width - The new width, or a full Dimension to copy it from.
     * @param {number=} height - Not used when `width` is a Dimension
     * @returns {AWT.Dimension}
     */
    setDimension: function (width, height) {
      if (width instanceof AWT.Dimension) {
        height = width.height;
        width = width.width;
      }
      this.width = width;
      this.height = height;
      return this;
    },
    /**
     * Calculates the area of a Rectangle with this dimension
     * @return {number} The resulting area
     */
    getSurface: function () {
      return this.width * this.height;
    }
  };

  /**
   *
   * Calculates some of the points included in a quadratic Bézier curve
   * The number of points being calculated is defined in Utils.settings.BEZIER_POINTS
   * @see {@link https://en.wikipedia.org/wiki/B%C3%A9zier_curve}
   * @see {@link https://www.jasondavies.com/animated-bezier/}
   *
   * @param {AWT.Point} p0 - Starting point of the quadratic Bézier curve
   * @param {AWT.Point} p1 - Control point
   * @param {AWT.Point} p2 - Ending point
   * @param {number=} numPoints - The number of intermediate points to calculate. When not defined,
   * the value will be obtained from {@link Utils.settings.BEZIER_POINTS}.
   * @returns {AWT.Point[]} - Array with some intermediate points from the resulting Bézier curve
   */
  AWT.getQuadraticPoints = function (p0, p1, p2, numPoints) {
    if (!numPoints)
      numPoints = Utils.settings.BEZIER_POINTS;
    var result = [];
    var pxa = new AWT.Point();
    var pxb = new AWT.Point();
    for (var i = 0; i < numPoints; i++) {
      var n = (i + 1) / (numPoints + 1);
      pxa.x = p0.x + (p1.x - p0.x) * n;
      pxa.y = p0.y - (p0.y - p1.y) * n;
      pxb.x = p1.x + (p2.x - p1.x) * n;
      pxb.y = p1.y + (p2.y - p1.y) * n;
      result.push(new AWT.Point(pxa.x + (pxb.x - pxa.x) * n, pxa.y - (pxa.y - pxb.y) * n));
    }
    return result;
  };

  /**
   *
   * Calculates some of the points included in a cubic Bézier (curve with two control points)
   * The number of points being calculated is defined in Utils.settings.BEZIER_POINTS
   * @param {AWT.Point} p0 - Starting point of the cubic Bézier curve
   * @param {AWT.Point} p1 - First control point
   * @param {AWT.Point} p2 - Second control point
   * @param {AWT.Point} p3 - Ending point
   * @param {number=} numPoints - The number of intermediate points to calculate. When not defined,
   * the value will be obtained from {@link Utils.settings.BEZIER_POINTS}.
   * @returns {AWT.Point[]} - Array with some intermediate points from the resulting Bézier curve
   */
  AWT.getCubicPoints = function (p0, p1, p2, p3, numPoints) {
    var result = [];
    if (!numPoints)
      numPoints = Utils.settings.BEZIER_POINTS;
    var pr = AWT.getQuadraticPoints(p0, p1, p2, numPoints);
    var pq = AWT.getQuadraticPoints(p1, p2, p3, numPoints);
    for (var i = 0; i < numPoints; i++) {
      var n = (i + 1) / (numPoints + 1);
      result.push(new AWT.Point(pr[i].x + (pq[i].x - pr[i].x) * n, pr[i].y - (pr[0].y - pq[0].y) * n));
    }
    return result;
  };

  /**
   *
   * Shape is a generic abstract class for rectangles, ellipses and stroke-free shapes.
   * @class
   * @abstract
   * @param {AWT.Point} pos - The top-left coordinates of this Shape
   */
  AWT.Shape = function (pos) {
    this.pos = pos || new AWT.Point();
  };

  AWT.Shape.prototype = {
    constructor: AWT.Shape,
    /**
     * The current position of the shape
     * @type {AWT.Point} */
    pos: new AWT.Point(),
    /**
     *
     * Shifts the shape a specified amount in horizontal and vertical directions
     * @param {AWT.Point|AWT.Dimension} delta - The amount to shift the Shape
     * @returns {AWT.Shape}
     */
    moveBy: function (delta) {
      this.pos.moveBy(delta);
      return this;
    },
    /**
     *
     * Moves this shape to a new position
     * @param {AWT.Point} newPos - The new position of the shape
     * @returns {AWT.Shape}
     */
    moveTo: function (newPos) {
      this.pos.moveTo(newPos);
      return this;
    },
    /**
     *
     * Gets the enclosing {@link AWT.Rectangle} of this Shape.
     * @returns {AWT.Rectangle}
     */
    getBounds: function () {
      return new AWT.Rectangle(this.pos);
    },
    /**
     *
     * Checks if two shapes are equivalent.
     * @param {AWT.Shape} p - The AWT.Shape to compare against
     * @returns {boolean}
     */
    equals: function (p) {
      return this.pos.equals(p.pos);
    },
    /**
     *
     * Multiplies the dimension of the Shape by the specified `delta` amount.
     * @param {AWT.Point|AWT.Dimension} _delta - Object containing the X and Y ratio to be scaled.
     * @returns {AWT.Shape}
     */
    scaleBy: function (_delta) {
      // Nothing to scale in abstract shapes
      return this;
    },
    /**
     *
     * Gets a clone of this shape moved to the `pos` component of the rectangle and scaled
     * by its `dim` value.
     * @param {AWT.Rectangle} rect - The rectangle to be taken as a base for moving and scaling
     * this shape.
     * @returns {AWT.Shape}
     */
    getShape: function (rect) {
      var newShape = this.clone();
      return newShape.scaleBy(rect.dim).moveBy(rect.pos);
    },
    /**
     *
     * Checks if the provided {@link AWT.Point} is inside this shape.
     * @param {AWT.Point} _p - The point to check
     * @returns {boolean}
     */
    contains: function (_p) {
      // Nothing to check in abstract shapes
      return false;
    },
    /**
     *
     * Checks if the provided {@link AWT.Rectangle} `r` intersects with this shape.
     * @param {AWT.Rectangle} _r
     * @returns {boolean}
     */
    intersects: function (_r) {
      // Nothing to check in abstract shapes
      return false;
    },
    /**
     *
     * Fills the Shape with the current style in the provided HTML canvas context
     * @param {external:CanvasRenderingContext2D} ctx - The canvas 2D rendering context where to fill this shape.
     * @param {AWT.Rectangle=} dirtyRegion - The context region to be updated. Used as clipping
     * region when drawing.
     * @returns {external:CanvasRenderingContext2D} - The provided rendering context
     */
    fill: function (ctx, dirtyRegion) {
      ctx.save();
      if (dirtyRegion && dirtyRegion.getSurface() > 0) {
        // Clip the dirty region
        ctx.beginPath();
        ctx.rect(dirtyRegion.pos.x, dirtyRegion.pos.y, dirtyRegion.dim.width, dirtyRegion.dim.height);
        ctx.clip();
      }
      // Prepare shape path and fill
      this.preparePath(ctx);
      ctx.fill();
      ctx.restore();
      return ctx;
    },
    /**
     *
     * Draws this shape in the provided HTML canvas 2D rendering context.
     * @param {external:CanvasRenderingContext2D} ctx - The canvas 2D rendering context where to draw the shape.
     * @returns {external:CanvasRenderingContext2D} - The provided rendering context
     */
    stroke: function (ctx) {
      this.preparePath(ctx);
      ctx.stroke();
      return ctx;
    },
    /**
     *
     * Prepares an HTML canvas 2D rendering context with a path that can be used to stroke a line,
     * to fill a surface or to define a clipping region.
     * @param {external:CanvasRenderingContext2D} ctx
     * @returns {external:CanvasRenderingContext2D} - The provided rendering context
     */
    preparePath: function (ctx) {
      // Nothing to do in abstract shapes
      return ctx;
    },
    /**
     *
     * Creates a clipping region on the specified HTML canvas 2D rendering context
     * @param {external:CanvasRenderingContext2D} ctx - The rendering context
     * @param {string=} [fillRule='nonzero'] - Can be 'nonzero' (default when not set) or 'evenodd'
     * @returns {external:CanvasRenderingContext2D} - The provided rendering context
     */
    clip: function (ctx, fillRule) {
      this.preparePath(ctx);
      ctx.clip(fillRule || 'nonzero');
      return ctx;
    },
    /**
     *
     * Shorthand method for determining if a Shape is an {@link AWT.Rectangle}
     * @returns {Boolean}
     */
    isRect: function () {
      return false;
    },
    /**
     * Overwrites the original 'Object.toString' method with a more descriptive text
     * @returns {String}
     */
    toString: function () {
      return 'Shape enclosed in ' + this.getBounds().getCoords();
    }
  };

  /**
   *
   * The rectangular {@link AWT.Shape} accepts five different sets of parameters:
   * @example
   * // Calling AWT.Rectangle() with different sets of parameters
   * // An AWT.Point and an AWT.Dimension:
   * new AWT.Rectangle(pos, dim);
   * // Another AWT.Rectangle, to be cloned:
   * new AWT.Rectangle(rect);
   * // Two AWT.Point objects containing the coordinates of upper-left and lower-right vertexs:
   * new AWT.Rectangle(p0, p1);
   * // An array of four numbers with the coordinates of the same vertexs:
   * new AWT.Rectangle([x0, y0, x1, y1]);
   * // Four single numbers, meaning the same coordinates as above:
   * new AWT.Rectangle(x0, y0, x1, y1);
   * @class
   * @extends AWT.Shape
   * @param {AWT.Point|AWT.Rectangle|number|number[]} pos
   * @param {AWT.Dimension|number=} dim
   * @param {number=} w
   * @param {number=} h
   */
  AWT.Rectangle = function (pos, dim, w, h) {
    var p = pos, d = dim;
    // Special case: constructor with a Rectangle as a unique parameter
    if (pos instanceof AWT.Rectangle) {
      d = new AWT.Dimension(pos.dim.width, pos.dim.height);
      p = new AWT.Point(pos.pos.x, pos.pos.y);
    } else if (pos instanceof AWT.Point) {
      p = new AWT.Point(pos.x, pos.y);
      if (dim instanceof AWT.Dimension)
        d = new AWT.Dimension(dim.width, dim.height);
    } else if (pos instanceof Array) {
      // Assume `pos` is an array of numbers indicating: x0, y0, x1, y1
      p = new AWT.Point(pos[0], pos[1]);
      d = new AWT.Dimension(pos[2] - pos[0], pos[3] - pos[1]);
    } else if (typeof w === 'number' && typeof h === 'number') {
      // width and height passed. Treat all parameters as co-ordinates:
      p = new AWT.Point(pos, dim);
      d = new AWT.Dimension(w, h);
    }
    AWT.Shape.call(this, p);
    if (d instanceof AWT.Dimension)
      this.dim = d;
    else if (d instanceof AWT.Point)
      this.dim = new AWT.Dimension(d.x - this.pos.x, d.y - this.pos.y);
    else
      this.dim = new AWT.Dimension();
  };

  AWT.Rectangle.prototype = {
    constructor: AWT.Rectangle,
    /**
     * The {@link AWT.Dimension} of the Rectangle
     * @type {AWT.Dimension} */
    dim: new AWT.Dimension(),
    /**
     * 
     * Gets the enclosing {@link AWT.Rectangle} of this Shape.
     * @returns {AWT.Rectangle}
     */
    getBounds: function () {
      return this;
    },
    /**
     *
     * Sets this Rectangle the position and dimension of another one
     * @param {AWT.Rectangle} rect
     * @returns {AWT.Rectangle}
     */
    setBounds: function (rect) {
      if (!rect)
        rect = new AWT.Rectangle();
      this.pos.x = rect.pos.x;
      this.pos.y = rect.pos.y;
      this.dim.width = rect.dim.width;
      this.dim.height = rect.dim.height;
      return this;
    },
    /**
     *
     * Checks if two shapes are equivalent.
     * @param {AWT.Shape} r - The AWT.Shape to compare against
     * @returns {boolean}
     */
    equals: function (r) {
      return r instanceof AWT.Rectangle && this.pos.equals(r.pos) && this.dim.equals(r.dim);
    },
    /**
     *
     * Clones this Rectangle
     * @returns {AWT.Rectangle}
     */
    clone: function () {
      return new AWT.Rectangle(this);
    },
    /**
     *
     * Multiplies the dimension of the Shape by the specified `delta` amount.
     * @param {AWT.Point|AWT.Dimension} delta - Object containing the X and Y ratio to be scaled.
     * @returns {AWT.Rectangle}
     */
    scaleBy: function (delta) {
      this.pos.multBy(delta);
      this.dim.multBy(delta);
      return this;
    },
    /**
     *
     * Expands the boundaries of this shape. This affects the current position and dimension.
     * @param {number} dx - The amount to grow (or decrease) in horizontal direction
     * @param {number} dy - The amount to grow (or decrease) in vertical direction
     * @returns {AWT.Rectangle}
     */
    grow: function (dx, dy) {
      this.pos.x -= dx;
      this.pos.y -= dy;
      this.dim.width += 2 * dx;
      this.dim.height += 2 * dy;
      return this;
    },
    /**
     *
     * Gets the {@link AWT.Point} corresponding to the lower-right vertex of the Rectangle.
     * @returns {AWT.Point}
     */
    getOppositeVertex: function () {
      return new AWT.Point(this.pos.x + this.dim.width, this.pos.y + this.dim.height);
    },
    /**
     *
     * Adds the boundaries of another shape to the current one
     * @param {AWT.Shape} shape - The {@link AWT.Shape} to be added
     * @returns {AWT.Rectangle}
     */
    add: function (shape) {
      var myP2 = this.getOppositeVertex();
      var rectP2 = shape.getBounds().getOppositeVertex();

      this.pos.moveTo(
        Math.min(this.pos.x, shape.getBounds().pos.x),
        Math.min(this.pos.y, shape.getBounds().pos.y));
      this.dim.setDimension(
        Math.max(myP2.x, rectP2.x) - this.pos.x,
        Math.max(myP2.y, rectP2.y) - this.pos.y);
      return this;
    },
    //
    // Inherits the documentation of `contains` in AWT.Shape
    contains: function (p) {
      var p2 = this.getOppositeVertex();
      return p.x >= this.pos.x && p.x <= p2.x && p.y >= this.pos.y && p.y <= p2.y;
    },
    //
    // Inherits the documentation of `intersects` in AWT.Shape
    intersects: function (r) {
      var p1 = this.pos, p2 = this.getOppositeVertex();
      var r1 = r.pos, r2 = r.getOppositeVertex();
      return r2.x >= p1.x && r1.x <= p2.x && r2.y >= p1.y && r1.y <= p2.y;
    },
    //
    // Inherits the documentation of `preparePath` in AWT.Shape
    preparePath: function (ctx) {
      ctx.beginPath();
      ctx.rect(this.pos.x, this.pos.y, this.dim.width, this.dim.height);
      return ctx;
    },
    //
    // Inherits the documentation of `getSurface` in AWT.Shape
    getSurface: function () {
      return this.dim.getSurface();
    },
    //
    // Inherits the documentation of `isEmpty` in AWT.Shape
    isEmpty: function () {
      return this.getSurface() === 0;
    },
    //
    // Inherits the documentation of `isRect` in AWT.Shape
    isRect: function () {
      return true;
    },
    //
    // Inherits the documentation of `toString` in AWT.Shape
    toString: function () {
      return 'Rectangle ' + this.getCoords();
    },
    /**
     * 
     * Gets a string with the co-ordinates of the upper-left and lower-right vertexs of this rectangle,
     * (with values rounded to int)
     * @returns {String}
     */
    getCoords: function () {
      return '[' + Math.round(this.pos.x) + ',' + Math.round(this.pos.y) + ',' +
        Math.round(this.pos.x + this.dim.width) + ',' + Math.round(this.pos.y + this.dim.height) + ']';
    }
  };
  // Rectangle extends Shape
  AWT.Rectangle.prototype = $.extend(Object.create(AWT.Shape.prototype), AWT.Rectangle.prototype);

  /**
   * The Ellipse shape has the same constructor options as {@link AWT.Rectangle}
   * @class
   * @extends AWT.Rectangle
   * @param {AWT.Point|AWT.Rectangle|number|number[]} pos
   * @param {AWT.Dimension|number=} dim
   * @param {number=} w
   * @param {number=} h
   */
  AWT.Ellipse = function (pos, dim, w, h) {
    AWT.Rectangle.call(this, pos, dim, w, h);
  };

  AWT.Ellipse.prototype = {
    constructor: AWT.Ellipse,
    //
    // Inherits the documentation of `preparePath` in AWT.Rectangle
    preparePath: function (ctx) {

      // Using the solution 'drawEllipseWithBezier' proposed by Steve Tranby in:
      // [http://jsbin.com/sosugenegi/1/edit] as a response to:
      // [http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas]
      // Thanks Steve!!

      var kappa = 0.5522848,
        ox = kappa * this.dim.width / 2, // control point offset horizontal
        oy = kappa * this.dim.height / 2, // control point offset vertical
        xe = this.pos.x + this.dim.width, // x-end
        ye = this.pos.y + this.dim.height, // y-end
        xm = this.pos.x + this.dim.width / 2, // x-middle
        ym = this.pos.y + this.dim.height / 2;// y-middle

      ctx.beginPath();
      ctx.moveTo(this.pos.x, ym);
      ctx.bezierCurveTo(this.pos.x, ym - oy, xm - ox, this.pos.y, xm, this.pos.y);
      ctx.bezierCurveTo(xm + ox, this.pos.y, xe, ym - oy, xe, ym);
      ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      ctx.bezierCurveTo(xm - ox, ye, this.pos.x, ym + oy, this.pos.x, ym);
      ctx.closePath();
      return ctx;
    },
    //
    // Inherits the documentation of `contains` in AWT.Shape
    contains: function (p) {
      // First check if the point is inside the enclosing rectangle
      var result = AWT.Rectangle.prototype.contains.call(this, p);
      if (result) {
        var rx = this.dim.width / 2;
        var ry = this.dim.height / 2;
        var cx = this.pos.x + rx;
        var cy = this.pos.y + ry;
        // Apply the general equation of an ellipse
        // See: [http://math.stackexchange.com/questions/76457/check-if-a-point-is-within-an-ellipse]
        // rx and ry are > 0 because we are inside the enclosing rect,
        // so don't care about division by zero
        result = Math.pow(p.x - cx, 2) / Math.pow(rx, 2) + Math.pow(p.y - cy, 2) / Math.pow(ry, 2) <= 1;
      }
      return result;
    },
    //
    // Inherits the documentation of `getSurface` in AWT.Rectangle
    getSurface: function () {
      return Math.PI * this.dim.width / 2 * this.dim.height / 2;
    },
    //
    // Inherits the documentation of `equals` in AWT.Rectangle
    equals: function (e) {
      return e instanceof AWT.Ellipse && AWT.Rectangle.prototype.equals.call(this, e);
    },
    //
    // Inherits the documentation of `clone` in AWT.Rectangle
    clone: function () {
      return new AWT.Ellipse(this.pos, this.dim);
    },
    //
    // Inherits the documentation of `isRect` in AWT.Rectangle
    isRect: function () {
      return false;
    },
    //
    // Inherits the documentation of `toString` in AWT.Shape
    toString: function () {
      return 'Ellipse enclosed in ' + this.getCoords();
    }
  };
  // Ellipse extends Rectangle
  AWT.Ellipse.prototype = $.extend(Object.create(AWT.Rectangle.prototype), AWT.Ellipse.prototype);

  /**
   *
   * A `Path` is a {@link AWT.Shape} formed by a serie of strokes, represented by
   * {@link AWT.PathStroke} objects
   * @class
   * @extends AWT.Shape
   * @param {AWT.PathStroke[]} strokes - The array of {@link AWT.PathStroke} objects defining this Path.
   */
  AWT.Path = function (strokes) {
    // Deep copy of the array of strokes
    if (strokes) {
      this.strokes = [];
      for (var n = 0; n < strokes.length; n++) {
        var str = strokes[n];
        str = new AWT.PathStroke(
          // In [Shaper](Shaper.html) objects, strokes have `action`, not `type`
          str.type || str.action,
          // In [Shaper](Shaper.html) objects, strokes have `data`, not `points`
          str.points || str.data);
        this.strokes.push(str);
      }
    }
    // Calculate the enclosing rectangle
    this.enclosing = new AWT.Rectangle();
    this.enclosingPoints = [];
    this.calcEnclosingRect();
    AWT.Shape.call(this, this.enclosing.pos);
  };

  AWT.Path.prototype = {
    constructor: AWT.Path,
    /**
     * The strokes forming this Path.
     * @type {AWT.PathStroke[]} */
    strokes: [],
    /**
     * The {@link AWT.Rectangle} enclosing this Path (when drawing, this Rectangle don't include border width!)
     * @type {AWT.Rectangle} */
    enclosing: new AWT.Rectangle(),
    /**
     * Set of vertexs of a polygon close to the real path of this shape
     * @type {AWT.Point[]} */
    enclosingPoints: [],
    //
    // Inherits the documentation of `clone` in AWT.Shape
    clone: function () {
      var str = [];
      for (var i = 0; i < this.strokes.length; i++)
        str[i] = this.strokes[i].clone();
      return new AWT.Path(str);
    },
    /**
     *
     * Adds a {@link AWT.PathStroke} to `strokes`
     * @param {AWT.PathStroke} stroke
     */
    addStroke: function (stroke) {
      this.strokes.push(stroke);
      return this;
    },
    /**
     *
     * Calculates the polygon and the rectangle that (approximately) encloses this shape
     * @returns {AWT.Rectangle}
     */
    calcEnclosingRect: function () {
      this.enclosingPoints = [];
      var last = new AWT.Point();
      for (var n = 0; n < this.strokes.length; n++) {
        var str = this.strokes[n];
        var points = str.getEnclosingPoints(last);
        if (points.length > 0) {
          for (var i = 0; i < points.length; i++) {
            last = new AWT.Point(points[i]);
            this.enclosingPoints.push(last);
          }
        }
      }

      var l = this.enclosingPoints.length;
      if (l > 1 && this.enclosingPoints[0].equals(this.enclosingPoints[l - 1])) {
        this.enclosingPoints.pop();
        l--;
      }

      var p0 = new AWT.Point(this.enclosingPoints[0]);
      var p1 = new AWT.Point(this.enclosingPoints[0]);
      for (var k = 1; k < l; k++) {
        var p = this.enclosingPoints[k];
        // Check if `p` is at left or above `p0`
        p0.x = Math.min(p.x, p0.x);
        p0.y = Math.min(p.y, p0.y);
        // Check if `p` is at right or below `p1`
        p1.x = Math.max(p.x, p1.x);
        p1.y = Math.max(p.y, p1.y);
      }
      this.enclosing.setBounds(new AWT.Rectangle(p0, new AWT.Dimension(p0, p1)));
      return this.enclosing;
    },
    //
    // Inherits the documentation of `getBounds` in AWT.Shape
    getBounds: function () {
      return this.enclosing;
    },
    //
    // Inherits the documentation of `moveBy` in AWT.Shape
    moveBy: function (delta) {
      for (var str = 0; str < this.strokes.length; str++)
        this.strokes[str].moveBy(delta);
      for (var p = 0; p < this.enclosingPoints.length; p++)
        this.enclosingPoints[p].moveBy(delta);
      this.enclosing.moveBy(delta);
      return this;
    },
    //
    // Inherits the documentation of `moveTo` in AWT.Shape
    moveTo: function (newPos) {
      var d = new AWT.Dimension(newPos.x - this.pos.x, newPos.y - this.pos.y);
      return this.moveBy(d);
    },
    //
    // Inherits the documentation of `equals` in AWT.Shape
    // TODO: Implement comparision of complex paths
    equals: function (_p) {
      return false;
    },
    //
    // Inherits the documentation of `scaleBy` in AWT.Shape
    scaleBy: function (delta) {
      for (var str = 0; str < this.strokes.length; str++)
        this.strokes[str].multBy(delta);
      for (var p = 0; p < this.enclosingPoints.length; p++)
        this.enclosingPoints[p].multBy(delta);
      this.enclosing.scaleBy(delta);
      return this;
    },
    //
    // Inherits the documentation of `contains` in AWT.Shape
    contains: function (p) {
      //return this.enclosing.contains(p);
      var result = this.enclosing.contains(p);
      if (result) {
        // Let's see if the point really lies inside the polygon formed by enclosingPoints
        // Using the "Ray casting algorithm" described in [https://en.wikipedia.org/wiki/Point_in_polygon]
        var p1 = this.enclosingPoints[0];
        var N = this.enclosingPoints.length;
        var xinters = 0;
        var counter = 0;
        for (var i = 1; i <= N; i++) {
          var p2 = this.enclosingPoints[i % N];
          if (p.y > Math.min(p1.y, p2.y)) {
            if (p.y <= Math.max(p1.y, p2.y)) {
              if (p.x <= Math.max(p1.x, p2.x)) {
                if (p1.y !== p2.y) {
                  xinters = (p.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
                  if (p1.x === p2.x || p.x <= xinters)
                    counter++;
                }
              }
            }
          }
          p1 = p2;
        }
        if (counter % 2 === 0)
          result = false;
      }
      return result;
    },
    //
    // Inherits the documentation of `intersects` in AWT.Shape
    // TODO: Implement a check algorithm based on the real shape
    intersects: function (r) {
      return this.enclosing.intersects(r);
    },
    //
    // Inherits the documentation of `preparePath` in AWT.Shape
    preparePath: function (ctx) {
      // TODO: Implement filling paths
      ctx.beginPath();
      for (var n = 0; n < this.strokes.length; n++)
        this.strokes[n].stroke(ctx);
      return ctx;
    }
  };
  // Path extends Shape
  AWT.Path.prototype = $.extend(Object.create(AWT.Shape.prototype), AWT.Path.prototype);

  /**
   *
   * PathStroke is the basic component of {@link AWT.Path} objects
   * @class
   * @param {string} type - The type of stroke. Possible values are: `M` (move to), `L` (line to),
   * `Q` (quadratic to), `B` (bezier to) and `X` (close path).
   * @param {AWT.Point[]} points - The array of {@link AWT.Point} objects used in this Stroke.
   */
  AWT.PathStroke = function (type, points) {
    this.type = type;
    // Points are deep cloned, to avoid change the original values
    if (points && points.length > 0) {
      this.points = [];
      // Check if 'points' is an array of objects of type 'Point'
      if (points[0] instanceof AWT.Point) {
        for (var p = 0; p < points.length; p++)
          this.points.push(new AWT.Point(points[p].x, points[p].y));
      }
      // otherwise assume that 'points' contains just numbers
      // to be readed in pairs of x and y co-ordinates
      else {
        for (var i = 0; i < points.length; i += 2)
          this.points.push(new AWT.Point(points[i], points[i + 1]));
      }
    }
  };

  AWT.PathStroke.prototype = {
    constructor: AWT.PathStroke,
    /**
     * The Stroke type. Possible values are: `M` (move to), `L` (line to), `Q` (quadratic to),
     * `B` (bezier to) and `X` (close path).
     * @type {string} */
    type: 'X',
    /**
     * The array of points used by this stroke. Can be `null`.
     * @type {AWT.Point[]} */
    points: null,
    /**
     *
     * Clones this PathStroke
     * @returns {AWT.PathStroke}
     */
    clone: function () {
      // The constructors of PathStroke always make a deep copy of the `points` array
      return new AWT.PathStroke(this.type, this.points);
    },
    /**
     *
     * Increments or decrements by `delta` the x and y coordinates of all points
     * @param {AWT.Point|AWT.Dimension} delta - The amount to add to the `x` and `y`
     * coordinates of each point.
     */
    moveBy: function (delta) {
      if (this.points)
        for (var p = 0; p < this.points.length; p++)
          this.points[p].moveBy(delta);
      return this;
    },
    /**
     *
     * Multiplies each point coordinates by the `x` and `y` (or `w` and `h`) values of the
     * passed {@link AWT.Point} or {@link AWT.Dimension}.
     * @param {AWT.Point|AWT.Dimension} delta
     */
    multBy: function (delta) {
      if (this.points)
        for (var p = 0; p < this.points.length; p++)
          this.points[p].multBy(delta);
      return this;
    },
    /**
     *
     * Draws this PathStroke in the provided HTML canvas context
     * @param {external:CanvasRenderingContext2D} ctx - The HTML canvas 2D rendering context
     */
    stroke: function (ctx) {
      switch (this.type) {
        case 'M':
          ctx.moveTo(this.points[0].x, this.points[0].y);
          break;
        case 'L':
          ctx.lineTo(this.points[0].x, this.points[0].y);
          break;
        case 'Q':
          ctx.quadraticCurveTo(
            this.points[0].x, this.points[0].y,
            this.points[1].x, this.points[1].y);
          break;
        case 'B':
          ctx.bezierCurveTo(
            this.points[0].x, this.points[0].y,
            this.points[1].x, this.points[1].y,
            this.points[2].x, this.points[2].y);
          break;
        case 'X':
          ctx.closePath();
          break;
      }
      return ctx;
    },
    /**
     *
     * Gets the set of points that will be included as a vertexs on the owner's shape
     * enclosing polygon.
     * @param {AWT.Point} from - The starting point for this stroke
     * @returns {AWT.Point[]}
     */
    getEnclosingPoints: function (from) {
      var result = [];
      switch (this.type) {
        case 'M':
        case 'L':
          result.push(this.points[0]);
          break;
        case 'Q':
          result = AWT.getQuadraticPoints(from, this.points[0], this.points[1]);
          result.push(this.points[1]);
          break;
        case 'B':
          result = AWT.getCubicPoints(from, this.points[0], this.points[1], this.points[2]);
          result.push(this.points[2]);
          break;
      }
      return result;
    }
  };

  /**
   *
   * This class encapsulates actions that can be linked to buttons, menus and other active objects
   * @class
   * @param {string} name - The name of this Action
   * @param {function} actionPerformed - The callback function to be triggered by this Action
   */
  AWT.Action = function (name, actionPerformed) {
    this.name = name;
    this.actionPerformed = actionPerformed;
    this._statusListeners = [];
  };

  AWT.Action.prototype = {
    constructor: AWT.Action,
    /**
     * The action's name
     * @type {string} */
    name: null,
    /**
     * An optional description
     * @type {string} */
    description: null,
    /**
     * Action status. `true` means enabled, `false` disabled
     * @type {boolean} */
    enabled: false,
    /**
     * Array of callback functions to be triggered when the `enabled` flag changes
     * @type {function[]} */
    _statusListeners: null,
    /**
     *
     * Here is where subclasses must define the callback function to be triggered when
     * this AWT.Action object is called
     * @param {AWT.Action} _thisAction - Pointer to this AWT.Action object
     * @param {object} _event - The original action event that has originated this action
     */
    actionPerformed: function (_thisAction, _event) {
      return this;
    },
    /**
     *
     * This is the method to be passed to DOM event triggers
     * @example
     * var myFunc = function(){
     *   alert('Hello!');
     * };
     * var myAction = new AWT.Action('hello', myFunc);
     * $( "#foo" ).bind( "click", myAction.processEvent);
     * @param {object} event - The event object passed by the DOM event trigger
     */
    processEvent: function (event) {
      return this.actionPerformed(this, event);
    },
    /**
     *
     * Adds a status listener
     * @param {function} listener - The callback method to be called when the status of this
     * Action changes
     */
    addStatusListener: function (listener) {
      this._statusListeners.push(listener);
    },
    /**
     *
     * Removes a previously registered status listener
     * @param {function} listener - The listener to be removed
     */
    removeStatusListener: function (listener) {
      this._statusListeners = $.grep(this._statusListeners, function (item) {
        return item !== listener;
      });
    },
    /**
     *
     * Enables or disables this action
     * @param {boolean} enabled
     */
    setEnabled: function (enabled) {
      this.enabled = enabled;
      for (var i = 0; i < this._statusListeners.length; i++)
        this._statusListeners[i].call(this);
      return this;
    }
  };

  /**
   *
   * This class provides a timer that will launch a function at specific intervals
   * @class
   * @param {function} actionPerformed - The function to be triggered when the timer is enabled.
   * @param {number} interval - The interval between action calls, specified in milliseconds.
   * @param {boolean=} [enabled=false] - Flag to indicate if the timer will be initially enabled.
   */
  AWT.Timer = function (actionPerformed, interval, enabled) {
    this.actionPerformed = actionPerformed;
    this.interval = interval;
    this.setEnabled(enabled === true);
  };

  AWT.Timer.prototype = {
    constructor: AWT.Timer,
    /**
     * The timer interval, in milliseconds
     * @type {number} */
    interval: 0,
    /**
     * The ticks counter
     * @type {number} */
    ticks: 0,
    /**
     * The object returned by `window.setInterval`
     * @type {object} */
    timer: null,
    /**
     * When `true`, the timer should repeat until `stop` is called
     * @type {boolean} */
    repeats: true,
    /**
     *
     * Here is where subclasses must define the function to be performed when this timer ticks.
     * @param {AWT.Timer} _thisTimer
     */
    actionPerformed: function (_thisTimer) {
      return this;
    },
    /**
     *
     * This is the method called by `window.setInterval`
     * @param {Event} _event
     */
    processTimer: function (_event) {
      this.ticks++;
      if (!this.repeats)
        this.stop();
      return this.actionPerformed.call(this);
    },
    /**
     *
     * Enables or disables this timer
     * @param {boolean} enabled - Indicates if the timer should be enabled or disabled
     * @param {boolean=} [retainCounter=false] - When `true`, the ticks counter will not be cleared
     */
    setEnabled: function (enabled, retainCounter) {
      if (!retainCounter)
        this.ticks = 0;
      if (enabled && this.timer !== null) {
        // Timer already running
        return;
      }

      if (enabled) {
        var self = this;
        this.timer = window.setInterval(function () {
          self.processTimer(null);
        }, this.interval);
      } else {
        if (this.timer !== null) {
          window.clearInterval(this.timer);
          this.timer = null;
        }
      }
      return this;
    },
    /**
     *
     * Checks if this timer is running
     * @returns {Boolean}
     */
    isRunning: function () {
      return this.timer !== null;
    },
    /**
     *
     * Starts this timer
     * @param {boolean=} [retainCounter=false] - When `true`, the ticks counter will not be cleared
     */
    start: function (retainCounter) {
      return this.setEnabled(true, retainCounter);
    },
    /**
     *
     * Stops this timer
     * @param {boolean=} [retainCounter=false] - When `true`, the ticks counter will not be cleared
     */
    stop: function (retainCounter) {
      return this.setEnabled(false, retainCounter);
    }
  };

  /**
   * Logic object that takes care of an "invalidated" rectangle that will be repainted
   * at the next update of a 2D object, usually an HTML Canvas.
   * AWT.Container has the same constructor options as {@link AWT.Rectangle}
   * @class
   * @extends AWT.Rectangle
   * @param {AWT.Point|AWT.Rectangle|number|number[]} pos
   * @param {AWT.Dimension|number=} dim
   * @param {number=} w
   * @param {number=} h
   */
  AWT.Container = function (pos, dim, w, h) {
    AWT.Rectangle.call(this, pos, dim, w, h);
  };

  AWT.Container.prototype = {
    constructor: AWT.Container,
    /**
     * The currently "invalidated" area
     * @type {AWT.Rectangle} */
    invalidatedRect: null,
    /**
     *
     * Adds the provided rectangle to the invalidated area.
     * @param {AWT.Rectangle} rect
     */
    invalidate: function (rect) {
      if (rect) {
        if (this.invalidatedRect === null)
          this.invalidatedRect = rect.clone();
        else
          this.invalidatedRect.add(rect);
      } else
        this.invalidatedRect = null;
      return this;
    },
    /**
     *
     * Updates the invalidated area
     */
    update: function () {
      this.updateContent(this.invalidatedRect);
      if (this.invalidatedRect)
        this.invalidatedRect = null;
      return this;
    },
    /**
     *
     * Containers should implement this method to update its graphic contents. It should
     * be called from {@link AWT.Container~update}
     * @param {AWT.Shape} _dirtyRegion - Specifies the area to be updated. When `null`, it's the whole
     * Container.
     */
    updateContent: function (_dirtyRegion) {
      // To be overrided by subclasses. Here does nothing.
      return this;
    }
  };
  // Container extends Rectangle
  AWT.Container.prototype = $.extend(Object.create(AWT.Rectangle.prototype), AWT.Container.prototype);

  return AWT;
});
