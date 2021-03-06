/**
 *  File    : activities/puzzles/DoublePuzzle.js
 *  Created : 22/05/2015
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
  "../../Activity",
  "../../boxes/ActiveBoxGrid",
  "../../boxes/BoxBag",
  "../../boxes/BoxConnector",
  "../../AWT"
], function ($, Activity, ActiveBoxGrid, BoxBag, BoxConnector, AWT) {

  /**
   * The aim of this class of {@link Activity} is to put in order the scrambled elements of an
   * {@link ActiveBagContent} that contains an image, sounds, text... or any other media content.
   *
   * The activity uses two panels: one with the scrambled cells, and other initially empty where
   * this cells must be placed in order.
   * @exports DoublePuzzle
   * @class
   * @extends Activity
   * @param {JClicProject} project - The {@link JClicProject} to which this activity belongs
   */
  var DoublePuzzle = function (project) {
    Activity.call(this, project);
  };

  DoublePuzzle.prototype = {
    constructor: DoublePuzzle,
    /**
     *
     * Retrieves the minimum number of actions needed to solve this activity.
     * @returns {number}
     */
    getMinNumActions: function () {
      return this.abc.primary.getNumCells();
    },
    /**
     *
     * Whether or not the activity uses random to scramble internal components
     * @returns {boolean}
     */
    hasRandom: function () {
      return true;
    },
    /**
     *
     * When `true`, the activity must always be scrambled
     * @returns {boolean}
     */
    shuffleAlways: function () {
      return true;
    },
    /**
     *
     * Whether the activity allows the user to request help.
     * @returns {boolean}
     */
    helpSolutionAllowed: function () {
      return true;
    }
  };

  // InformationScreen extends Activity
  DoublePuzzle.prototype = $.extend(Object.create(Activity.prototype), DoublePuzzle.prototype);

  /**
   * The {@link Activity.Panel} where double puzzle activities are played.
   * @class
   * @extends Activity.Panel
   * @param {Activity} act - The {@link Activity} to which this Panel belongs
   * @param {JClicPlayer} ps - Any object implementing the methods defined in the
   * [PlayStation](http://projectestac.github.io/jclic/apidoc/edu/xtec/jclic/PlayStation.html)
   * Java interface.
   * @param {external:jQuery=} $div - The jQuery DOM element where this Panel will deploy
   */
  DoublePuzzle.Panel = function (act, ps, $div) {
    Activity.Panel.call(this, act, ps, $div);
  };

  var ActPanelAncestor = Activity.Panel.prototype;

  DoublePuzzle.Panel.prototype = {
    constructor: DoublePuzzle.Panel,
    /**
     * The {@link ActiveBoxBag} object containing the information to be displayed in the `primary` panel
     * @type {ActiveBoxBag} */
    bgA: null,
    /**
     * The secondary {@link ActiveBoxBag}, initially empty.
     * @type {ActiveBoxBag} */
    bgB: null,
    /**
     * The box connector
     * @type {BoxConnector} */
    bc: null,
    /**
     * List of mouse, touch and keyboard events intercepted by this panel
     * @type {string[]} */
    events: ['mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchend', 'touchmove', 'touchcancel'],
    /**
     *
     * Miscellaneous cleaning operations
     */
    clear: function () {
      if (this.bgA) {
        this.bgA.end();
        this.bgA = null;
      }
      if (this.bgB) {
        this.bgB.end();
        this.bgB = null;
      }
    },
    /**
     *
     * Prepares the visual components of the activity
     */
    buildVisualComponents: function () {

      if (this.firstRun)
        ActPanelAncestor.buildVisualComponents.call(this);

      this.clear();

      var abc = this.act.abc['primary'];
      if (abc) {

        if (abc.imgName)
          abc.setImgContent(this.act.project.mediaBag, null, false);

        if (this.act.acp !== null)
          this.act.acp.generateContent(abc.nch, abc.ncw, [abc], false);

        this.bgA = ActiveBoxGrid.createEmptyGrid(null, this, this.act.margin, this.act.margin, abc);
        this.bgB = ActiveBoxGrid.createEmptyGrid(null, this, this.act.margin, this.act.margin, abc);

        this.bgA.setContent(abc);

        this.bgA.accessibleText = this.ps.getMsg('source');
        this.bgB.accessibleText = this.ps.getMsg('target');

        this.bgA.setVisible(true);
        this.bgB.setVisible(true);

        var bgbA = this.bgA.getBackgroundActiveBox();
        var bgbB = this.bgB.getBackgroundActiveBox();
        if (bgbA && bgbB)
          bgbB.exchangeContent(bgbA);
      }
    },
    /**
     *
     * Basic initialization procedure
     */
    initActivity: function () {
      ActPanelAncestor.initActivity.call(this);

      if (!this.firstRun)
        this.buildVisualComponents();
      else
        this.firstRun = false;

      if (this.bgA && this.bgB) {
        this.shuffle([this.bgA], true, true);
        if (this.useOrder)
          this.currentItem = this.bgA.getNextItem(-1);
        this.setAndPlayMsg('initial', 'start');
        this.invalidate().update();
        this.playing = true;
      }
    },
    /**
     * Updates the graphic content of this panel.
     * This method will be called from {@link AWT.Container#update} when needed.
     * @param {AWT.Rectangle} dirtyRegion - Specifies the area to be updated. When `null`,
     * it's the whole panel.
     */
    updateContent: function (dirtyRegion) {
      ActPanelAncestor.updateContent.call(this, dirtyRegion);
      if (this.bgA && this.bgB && this.$canvas) {
        var canvas = this.$canvas.get(-1);
        var ctx = canvas.getContext('2d');
        if (!dirtyRegion)
          dirtyRegion = new AWT.Rectangle(0, 0, canvas.width, canvas.height);
        ctx.clearRect(dirtyRegion.pos.x, dirtyRegion.pos.y, dirtyRegion.dim.width, dirtyRegion.dim.height);
        this.bgA.update(ctx, dirtyRegion);
        this.bgB.update(ctx, dirtyRegion);
      }
      return this;
    },
    /**
     *
     * Sets the real dimension of this panel.
     * @param {AWT.Dimension} preferredMaxSize - The maximum surface available for the activity panel
     * @returns {AWT.Dimension}
     */
    setDimension: function (preferredMaxSize) {
      if (!this.bgA || !this.bgB || this.getBounds().equals(preferredMaxSize))
        return preferredMaxSize;
      return BoxBag.layoutDouble(preferredMaxSize, this.bgA, this.bgB, this.act.boxGridPos, this.act.margin);
    },
    /**
     *
     * Sets the size and position of this activity panel
     * @param {AWT.Rectangle} rect
     */
    setBounds: function (rect) {
      if (this.$canvas)
        this.$canvas.remove();

      ActPanelAncestor.setBounds.call(this, rect);
      if (this.bgA || this.bgB) {
        // Create the main canvas
        this.$canvas = $('<canvas width="' + rect.dim.width + '" height="' + rect.dim.height + '"/>').css({
          position: 'absolute',
          top: 0,
          left: 0
        });
        this.$div.append(this.$canvas);

        // Create a [BoxConnector](BoxConnector.html) and attach it to the canvas context
        this.bc = new BoxConnector(this, this.$canvas.get(-1).getContext('2d'));

        // Repaint all
        this.invalidate().update();
      }
    },
    /**
     * 
     * Builds the accessible components needed for this Activity.Panel
     * This method is called when all main elements are placed and visible, when the activity is ready
     * to start or when resized.
     */
    buildAccessibleComponents: function () {
      if (this.$canvas && this.accessibleCanvas) {
        ActPanelAncestor.buildAccessibleComponents.call(this);
        if (this.bgA)
          this.bgA.buildAccessibleElements(this.$canvas, this.$div, 'mousedown');
        if (this.bgB) {
          this.bgB.setCellAttr('accessibleAlwaysActive', true);
          this.bgB.buildAccessibleElements(this.$canvas, this.$div, 'mousedown');
        }
      }
    },
    /**
     *
     * Main handler used to process mouse, touch, keyboard and edit events
     * @param {HTMLEvent} event - The HTML event to be processed
     * @returns {boolean=} - When this event handler returns `false`, jQuery will stop its
     * propagation through the DOM tree. See: {@link http://api.jquery.com/on}
     */
    processEvent: function (event) {
      if (this.bc && this.playing) {
        //
        // The [AWT.Point](AWT.html#Point) where the mouse or touch event has been originated
        var p = null;
        //
        // Two [ActiveBox](ActiveBox.html) pointers used for the [BoxConnector](BoxConnector.html)
        // `origin` and `dest` points.
        var bx1, bx2;
        //
        // _touchend_ event don't provide pageX nor pageY information
        if (event.type === 'touchend') {
          p = this.bc.active ? this.bc.dest.clone() : new AWT.Point();
        } else {
          // Touch events can have more than one touch, so `pageX` must be obtained from `touches[0]`
          var x = event.originalEvent && event.originalEvent.touches ? event.originalEvent.touches[0].pageX : event.pageX;
          var y = event.originalEvent && event.originalEvent.touches ? event.originalEvent.touches[0].pageY : event.pageY;
          p = new AWT.Point(x - this.$div.offset().left, y - this.$div.offset().top);
        }

        // Flag for tracking `mouseup` events
        var up = false;

        switch (event.type) {
          case 'touchcancel':
            // Canvel movement
            if (this.bc.active)
              this.bc.end();
            break;

          case 'mouseup':
            // Don't consider drag moves below 3 pixels. Can be a "trembling click"
            if (this.bc.active && p.distanceTo(this.bc.origin) <= 3) {
              break;
            }
            up = true;
          /* falls through */
          case 'touchend':
          case 'touchstart':
          case 'mousedown':
            if (!this.bc.active) {
              //
              // A new pairing starts
              //
              // Pairings can never start with a `mouseup` event
              if (up)
                break;
              else
                this.ps.stopMedia(1);

              //
              // Find the ActiveBox behind the clicked point
              bx1 = this.bgA.findActiveBox(p);
              if (bx1 && !bx1.isInactive() && (!this.act.useOrder || bx1.idOrder === this.currentItem)) {
                // Start the [BoxConnector](BoxConnector.html)
                if (this.act.dragCells)
                  this.bc.begin(p, bx1);
                else
                  this.bc.begin(p);
                // Play cell media or event sound
                if (!bx1.playMedia(this.ps))
                  this.playEvent('click');

                // Move the focus to the opposite accessible group
                if (this.bgB.$accessibleDiv)
                  this.bgB.$accessibleDiv.focus();
              }
            } else {
              this.ps.stopMedia(1);
              // Pairing completed
              //
              // Find the active boxes behind `bc.origin` and `p`
              if (this.act.dragCells)
                bx1 = this.bc.bx;
              else
                bx1 = this.bgA.findActiveBox(this.bc.origin);
              bx2 = this.bgB.findActiveBox(p);

              // BoxConnector ends here
              this.bc.end();

              // Check if the pairing was OK
              if (bx1 && bx2 && bx2.isInactive()) {
                var ok = false;
                var src = bx1.getDescription() + " (" + bx1.idOrder + ")";
                var dest = "(" + bx2.idOrder + ")";
                var target = this.act.abc['primary'].getActiveBoxContent(bx2.idOrder);
                if (bx1.getContent().isEquivalent(target, true)) {
                  // Pairing OK
                  ok = true;
                  bx1.exchangeContent(bx2);
                  bx1.setVisible(false);
                  if (this.act.useOrder)
                    this.currentItem = this.bgA.getNextItem(this.currentItem);
                }
                // Check results and notify action
                var cellsAtPlace = this.bgA.countInactiveCells();
                this.ps.reportNewAction(this.act, 'PLACE', src, dest, ok, cellsAtPlace);
                // Finish activity or play event sound
                if (ok && cellsAtPlace === this.bgA.getNumCells())
                  this.finishActivity(true);
                else
                  this.playEvent(ok ? 'actionOk' : 'actionError');
              }
              this.update();

              // Move the focus to the `source` accessible group
              if (this.bgA.$accessibleDiv)
                this.bgA.$accessibleDiv.focus();
            }
            break;

          case 'mousemove':
          case 'touchmove':
            this.bc.moveTo(p);
            break;
        }
        event.preventDefault();
      }
    }
  };

  // DoublePuzzle.Panel extends Activity.Panel
  DoublePuzzle.Panel.prototype = $.extend(Object.create(ActPanelAncestor), DoublePuzzle.Panel.prototype);

  // Register class in Activity.prototype
  Activity.CLASSES['@puzzles.DoublePuzzle'] = DoublePuzzle;

  return DoublePuzzle;

});
