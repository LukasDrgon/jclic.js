/**
 *  File    : activities/text/Identify.js
 *  Created : 20/06/2015
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
  "./TextActivityBase"
], function ($, Activity, TextActivityBase) {

  /**
   * This type of text activity suggests users to click on specific words or single letters of a
   * given text, without any help on where these elements are placed.
   * @exports IdentifyText
   * @class
   * @extends TextActivityBase
   * @param {JClicProject} project - The project to which this activity belongs
   */
  //
  // TODO: Implement Identify text activities
  var IdentifyText = function (project) {
    TextActivityBase.call(this, project);
  };

  IdentifyText.prototype = {
    constructor: IdentifyText
  };

  //
  // Identify extends TextActivityBase
  IdentifyText.prototype = $.extend(Object.create(TextActivityBase.prototype), IdentifyText.prototype);

  /**
   * The {@link TextActivityBase.Panel} where this kind of text activities are played.
   * @class
   * @extends TextActivityBase.Panel
   * @param {Activity} act - The {@link Activity} to which this Panel belongs
   * @param {JClicPlayer} ps - Any object implementing the methods defined in the
   * [PlayStation](http://projectestac.github.io/jclic/apidoc/edu/xtec/jclic/PlayStation.html)
   * Java interface.
   * @param {external:jQuery=} $div - The jQuery DOM element where this Panel will deploy
   */
  IdentifyText.Panel = function (act, ps, $div) {
    TextActivityBase.Panel.call(this, act, ps, $div);
  };

  var ActPanelAncestor = TextActivityBase.Panel.prototype;
  IdentifyText.Panel.prototype = {
    constructor: IdentifyText.Panel,
    /**
     * Flag indicating if targets must be visually marked when the activity begins. In this type of
     * activity should be always `false` to avoid revealing the words o letters that must be found.
     * @type {boolean} */
    targetsMarked: false,
    /**
     *
     * Creates a target DOM element for the provided target.
     * @param {TextActivityDocument.TextTarget} target - The target related to the DOM object to be created
     * @param {external:jQuery} $span -  - An initial DOM object (usually a `span`) that can be used
     * to store the target, or replaced by another type of object.
     * @returns {external:jQuery} - The jQuery DOM element loaded with the target data.
     */
    $createTargetElement: function (target, $span) {

      ActPanelAncestor.$createTargetElement.call(this, target, $span);

      var id = this.targets.length - 1;
      var idLabel = 'target' + ('000' + id).slice(-3);
      var panel = this;

      $span.bind('click', function (event) {
        event.textTarget = target;
        event.idLabel = idLabel;
        panel.processEvent(event);
      });

      return $span;
    },
    /**
     *
     * Basic initialization procedure
     */
    initActivity: function () {
      ActPanelAncestor.initActivity.call(this);
      this.$div.find('.JClicTextDocument > p').css('cursor', 'pointer');
      this.playing = true;
    },
    /**
     *
     * Counts the number of targets that are solved
     * @returns {number}
     */
    countSolvedTargets: function () {
      var result = 0;
      for (var i = 0; i < this.targets.length; i++) {
        var t = this.targets[i];
        if (t.targetStatus === 'SOLVED')
          result++;
      }
      return result;
    },
    /**
     *
     * Evaluates all the targets in this panel. This method is usually called from the `Check` button.
     * @returns {boolean} - `true` when all targets are OK, `false` otherwise.
     */
    evaluatePanel: function () {
      var targetsOk = 0;
      var numTargets = this.targets.length;
      for (var i = 0; i < numTargets; i++) {
        var target = this.targets[i];
        var ok = target.targetStatus === 'SOLVED';
        if (ok)
          targetsOk++;
        target.checkColors();
        this.ps.reportNewAction(this.act, 'SELECT', target.text, target.pos, ok, targetsOk);
      }
      if (targetsOk === numTargets) {
        this.finishActivity(true);
        return true;
      } else {
        this.playEvent('finishedError');
      }
      return false;
    },
    /**
     *
     * Ordinary ending of the activity, usually called form `processEvent`
     * @param {boolean} result - `true` if the activity was successfully completed, `false` otherwise
     */
    finishActivity: function (result) {
      this.$div.find('.JClicTextDocument > p').css('cursor', 'pointer');
      return ActPanelAncestor.finishActivity.call(this, result);
    },
    /**
     * Used to avoid duplicate event processing
     * @type {number}
     */
    lastTimeStamp: 0,
    /**
     *
     * Main handler used to process mouse, touch, keyboard and edit events.
     * @param {HTMLEvent} event - The HTML event to be processed
     * @returns {boolean=} - When this event handler returns `false`, jQuery will stop its
     * propagation through the DOM tree. See: {@link http://api.jquery.com/on}
     */
    processEvent: function (event) {

      if (!ActPanelAncestor.processEvent.call(this, event) ||
        event.timeStamp === this.lastTimeStamp)
        return false;

      if (event.timeStamp)
        this.lastTimeStamp = event.timeStamp;

      var target = event.textTarget;

      switch (event.type) {
        case 'click':
          var text, pos, ok = false;
          if (target) {
            if (target.targetStatus === 'SOLVED') {
              target.targetStatus = 'HIDDEN';
            } else {
              target.targetStatus = 'SOLVED';
              ok = true;
            }
            text = target.text;
            pos = target.pos;
            // TODO: Just on/off target colors, don't mark it as error!
            target.checkColors();
          } else {
            // TODO: Get current text at click position, perhaps using [window|document].getSelection
            text = 'unknown';
            pos = 0;
          }

          if (!this.$checkButton) {
            // Check and notify action
            var cellsAtPlace = this.countSolvedTargets();
            this.ps.reportNewAction(this.act, 'SELECT', text, pos, ok, cellsAtPlace);

            // End activity or play event sound
            if (ok && cellsAtPlace === this.targets.length)
              this.finishActivity(true);
            else
              this.playEvent(ok ? 'actionOk' : 'actionError');
          }

          event.preventDefault();
          break;

        default:
          break;
      }
      return true;
    }

  };

  // Identify.Panel extends TextActivityBase.Panel
  IdentifyText.Panel.prototype = $.extend(Object.create(ActPanelAncestor), IdentifyText.Panel.prototype);

  // Register class in Activity.prototype
  Activity.CLASSES['@text.Identify'] = IdentifyText;

  return IdentifyText;
});
