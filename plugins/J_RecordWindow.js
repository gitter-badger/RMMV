/* -------------------------------------------------------------------------- */
// J_RecordWindow
// V: 1.0
//

/*:@plugindesc This plugin creates a window that acts as a log for EXP/GOLD/items acquired.
@author J

@help The window here is primarily for use with on-the-map battling.
      It acts as an alternative to the innate "popup" functionality
      of the existing qABS which to me, felt very barebones and
      kind ugly-looking.

      The main way the plugin works, is that there is a queue of
      things that the window draws. The window stalls for X frames
      (120 by default, so 2 seconds), then starts deleting things
      out of the queue, oldest first, on 1 second intervals. Whenever
      something is added to the queue, the stall timer of 120 frames
      is reset. This repeats until all items are emptied from the
      queue.

      NOTE:
      This plugin draws in the EXP earned either via events or from
      defeating enemies. Note: negative parameters such as losing
      EXP / gold / items will be displayed as "gained -x stuff"
      because it was designed that way. I'm sure you could modify
      the switch with the text if you wanted to make it accommodate
      both negative and positive experiences with exp/gold/items.

      As a person relatively new to writing code for use by others,
      I left a crap-ton of comments all throughout the code if you
      are interested in understanding how it works. If you want to
      optimize it, feel free, but be sure to let me know what you
      did so I can learn how too! :)

      This plugin has no dependencies.
      Just use as-is.

@param w_width
@desc Window width of the record box.
@default 400

@param w_height
@desc Window height of the record box.
@default 196

@param stallMod
@desc The time in frames (60 frames = 1 second, roughly) before stuff starts disappearing
@default 120

*/
var Imported = Imported || {};
Imported.J_RecordWindow = true;

var J = J || {}; J.Records = J.Records || {};

J.Records.parameters = PluginManager.parameters('J_RecordWindow');
J.Records.winWidth = Number(J.Records.parameters['w_width']) || 400; // wide enough for most things
J.Records.winHeight = Number(J.Records.parameters['w_height']) || 196; // enough for 5 lines
J.Records.stallMod = Number(J.Records.parameters['stallMod']) || 120; // 2 second stall

(function() { // start plugin.
/* -------------------------------------------------------------------------- */
// if the window on the map doesn't exist, make it.
// if it does exist, update it.
// if there is stuff going on, hide window.
Scene_Map.prototype.handleRecordBox = function() {
  var wx = Graphics.width - J.Records.winWidth;
  var hy = Graphics.height - J.Records.winHeight;
  if (this._recordWindow) {
    this._recordWindow.update;
  }
  else {
    this._recordWindow = new Window_Record(wx, hy, J.Records.winWidth, J.Records.winHeight);
    this.addWindow(this._recordWindow);
  };
  if (this.hideExtras()) {
    this._recordWindow.close();
  }
  else {
      this._recordWindow.open();
  }
};

// latches into the update of the map
// this permits continuous updating of the _recordWindow
var _Scene_Map_jrw_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
  this.handleRecordBox();
  _Scene_Map_jrw_update.call(this);
};//update

/* -------------------------------------------------------------------------- */
  // latches into the .gainExp function
  // pushes a message into _recordWindow queue for updating
  var _Game_Actor_jrw_gainExp = Game_Actor.prototype.gainExp;
  Game_Actor.prototype.gainExp = function(exp) {
    _Game_Actor_jrw_gainExp.call(this, exp);
    var scene = SceneManager._scene;
    var e = new Record_Item(exp, 1);
    if (scene.constructor == Scene_Map) {
      scene._recordWindow.addItem(e);
    }
  };

  // latches into the event command of experience gained
  // pushes a message into _recordWindow queue for updating
  var _Game_Interpreter_jrw_command315 = Game_Interpreter.prototype.command315;
  Game_Interpreter.prototype.command315 = function() {
    _Game_Interpreter_jrw_command315.call(this);
    var scene = SceneManager._scene;
    var e = new Record_Item(this._params[4], 1);
    if (scene.constructor == Scene_Map) {
      scene._recordWindow.addItem(e);
    }
    return true;
  };

  // latches into the .gainGold function
  // pushes a message into _recordWindow queue for updating
  var _Game_Party_jrw_gainGold = Game_Party.prototype.gainGold;
  Game_Party.prototype.gainGold = function(amount) {
    _Game_Party_jrw_gainGold.call(this, amount);
    var scene = SceneManager._scene;
    var g = new Record_Item(amount, 2);
    if (scene.constructor == Scene_Map) {
      scene._recordWindow.addItem(g);
    }
  };

  // latches into the .gainItem function
  // pushes a message into _recordWindow queue for updating
  // the details of what the "item" properties are were
  // gotten from the F1 help menu under the JS Library at the bottom
  var _Game_Party_jrw_gainItem = Game_Party.prototype.gainItem;
  Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
    _Game_Party_jrw_gainItem.call(this, item, amount, includeEquip);
    var scene = SceneManager._scene;
    if (item != null) { // this check is necessary to prevent errors in Scene_Equip
      var i = new Record_Item(item.name, 0, item.iconIndex);
      if (scene.constructor == Scene_Map) {
        scene._recordWindow.addItem(i);
      }
    }
  };

/* -------------------------------------------------------------------------- */
  // the creation function:
  // mimics the setup of a window like all other windows.
  function Window_Record() { this.initialize.apply(this, arguments); };
  Window_Record.prototype = Object.create(Window_Base.prototype);
  Window_Record.prototype.constructor = Window_Record;

  // the initialization function:
  // things that need to happen only once happen here
  // like setting up variables
  Window_Record.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._list = [];
    this._stall = 120;
    this.refresh(); // refresh window contients.
    this.activate(); // *@active = true
  };

  // the update function:
  // things that need to be updated every frame happen here.
  Window_Record.prototype.update = function() {
    Window_Base.prototype.update.call(this); // *super()
    this.refresh();
    // do things once per frame here
  };

  // the refresh function:
  // things that need to be drawn to the window will happen here.
  Window_Record.prototype.refresh = function() {
    if (this.contents) {
      this.contents.clear();
      // draw things to the window here
      this.updateItems();
    }
  };

  // function for adding an item to the window
  // adds new item at end of list
  // also resets the stall time back to 3seconds
  Window_Record.prototype.addItem = function(record) {
    this._stall = 120;
    this.contentsOpacity = 255;
    this._list.push(record);
  };

  // function for deleting an item from the window
  // removes the item at 0 index.
  Window_Record.prototype.RemoveItem = function() {
    this.contentsOpacity = 255;
    this._list.shift();
  };

  // function for updating all items in the window
  Window_Record.prototype.updateItems = function() {
    this.contents.fontSize = 18;
    var lh = this.lineHeight() - 4; // should be 36 - 4 = 32.

    if (this._list.length > 0) { // confirms the queue has contents
      var nextItem = this._list[0]; // grabs the first item in queue
      if (this._stall >= 0) { // checks the stall counter
        this._stall--;        // if it is still there, reduces stall
      }
      else {
        if (nextItem._duration <= 0) { // if stall is passed
          this.RemoveItem(nextItem);   // remove item with no duration
        }
        else {
        nextItem._duration--;         // reduces duration of next item
        if (nextItem._duration < 10)
          this.contentsOpacity -= 25;

        }
      }
    }

    for (var i = 0; i < this._list.length; i++) { // iterates through each item in the queue
      var modY = lh * (i);
      var item = this._list[i];
      this.drawListItem(item, 0, modY); // draws each item in the list
    }

  };

  Window_Record.prototype.drawListItem = function(i, x, y) {
    var w = J.test_bWidth - (this.standardPadding() * 2);
    switch (i._type) {
      case 0: // for items
        this.drawIcon(i._iconIndex, x, y);
        this.drawText(i._name + " found.", x + 32, y, w);
      break;
      case 1: // for experience
        this.drawIcon(87, x, y);
        this.drawText(i._name + " experience gained.", x + 32, y, w)
      break;
      case 2: // for gold
        this.drawIcon(314, x, y);
        this.drawText(i._name +' picked up.', x + 32, y, w)
      break;
      default: break; // there shouldn't be a need default case
    }
  };
/* -------------------------------------------------------------------------- */
// type 0 = item
// type 1 = exp
// type 2 = gold
// this is a constructor for all things that end up displayed
// within the log/record window.
// icon and duration are optional, EXP / GOLD have icons predefined.
// duration is set in two places: stall and duration.
Record_Item = function(name, type, icon, duration) {
  this._name = name;
  this._type = type;
  this._iconIndex = typeof icon !== 'undefined' ? icon : 0;
  this._duration = typeof duration !== 'undefined' ? duration : 60;
};

/* -------------------------------------------------------------------------- */
})(); // end plugin.
