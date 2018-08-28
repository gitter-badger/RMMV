/* -------------------------------------------------------------------------- */
// J_SDP
// V: 1.1
//
/*:@plugindesc Stat Distribution Panels
@author J

@help Shining Force NEO/EXA style stat distribution.

  This plugin is standalone and has no dependencies.
  Just let me know if you plan on using it for anything serious :)

@param cmdName
@text Command Name
@desc Designates the name of the command in the menu screen.
@default Distribute
*/
/* -------------------------------------------------------------------------- */

J = J || {};
J.SD = J.SD || {};

Imported = Imported || {};
Imported["JE Stat Distribution Panels"] = "0.1.0";

/* -------------------------------------------------------------------------- */

// Creates and returns a "panel" for use to upgrade with points.
// This panel is pushed into a given player's panel list.
J.SD.MakePanel = (cat = 0, fp = "flat", ea = 5, max = 10, cur = 0, cmult = 1.2, cgrow = 50) => {
  let panel = {
    category: cat,      // some parameter
    flatOrPercent: fp,  // flat/percent increase/decrease decision.
    perRank: ea,        // how much the increase/decrease is.
    rankMax: max,       // some number that defines how high it can go; 0 if infinite.
    rankCur: cur,       // always 0; increments +1 per rank up.
    cost: () => { // the cost formula, based on rankCur.
      if (rankCur === rankMax) return 0;
      return Math.floor(cmult * (cgrow * (this.rankCur + 1)));
    },

  }; 
  return panel;
};

J.SD.GetCommandName = function() {
  //var p = PluginManager.parameters('J_SDP');
  //return p['cmdName'];
  let name = "Distribution";
  return name;
};

J.SD.visibility = true;

/* -------------------------------------------------------------------------- */
console.log("outside.");
(function(_) { "use strict"; console.log("Beginning setup of SDP.");
console.log(_.GetCommandName());
  // hook into param + paramBase + paramPlus + clearParamPlus
  // add in the stat distribution points

  // hook into game_actor
  // add in the necessary variables
  _.sdpInit = Game_Actor.prototype.initMembers
  Game_Actor.prototype.initMembers = function() {
    _.sdpInit.call(this, this);
    this.initSDP();
    console.log(this);
  };

  Game_Actor.prototype.initSDP = function() {
    console.log("Initializing SDP system.");
    this._sdpCollection = [];   // the collection of panels will be in here.
    this._sdpPts = 0;           // how many points you have to be distributed across your panels.
    let defaultPanel = _.MakePanel();
    this.SDP_addPanel(defaultPanel);
  };
  
  // add/subtract distribution points.
  Game_Actor.prototype.SDP_modPoints = function(pts) {
    // add the points, negative or positive, to the current amount.
    this._sdpPts += pts;
    // make sure points are never lower than zero by this function.
    if (this._sdpPts < 0) this._sdpPts = 0;
  };

  // add panel to an actor of a type
  Game_Actor.prototype.SDP_addPanel = function(panel) {
    this._sdpCollection.push(panel);
  };

  /* -------------------------------------------------------------------------- */

  // adds in a new handler for Scene_SDP.
  var _Scene_Menu_sdp_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
  Scene_Menu.prototype.createCommandWindow = function() {
    _Scene_Menu_sdp_createCommandWindow.call(this);
    if (_.visibility) {
      this._commandWindow.setHandler('SDP', this.commandSDP.bind(this));
    }
  };

  // when command selected, pulls up the new scene.
  Scene_Menu.prototype.commandSDP = function() { SceneManager.push(Scene_SDP); };

  // adds the commands into the menu
  var _Scene_Menu_sdp_AddSDP = Window_MenuCommand.prototype.makeCommandList;
  Window_MenuCommand.prototype.makeCommandList = function() {
    _Scene_Menu_sdp_AddSDP.call(this);
    if (_.visibility) this.AddSDP();
  };

  // the command for adding difficulties to the main menu
  Window_MenuCommand.prototype.AddSDP = function() {
    var enabled = this.areMainCommandsEnabled();
    var name = _.GetCommandName();
    this.insertCommand(name, 'SDP', enabled);
  };
  // this is a simple new function that splices a command at a given index
  // instead of just throwing it in at the end.
  Window_Command.prototype.insertCommand = function(name, symbol, enabled, ext, index) {
    if (enabled === undefined) { enabled = true; }
    if (ext === undefined) { ext = null; }
    if (index === undefined) { index = this._list.length - 1; }
    var obj = { name: name, symbol: symbol, enabled: enabled, ext: ext};
    this._list.splice(index, 0, obj);
  };

  /* -------------------------------------------------------------------------- */

  function Scene_SDP() { this.initialize.apply(this, arguments); }
  Scene_SDP.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_SDP.prototype.constructor = Scene_Menu;

  Scene_SDP.prototype.initialize = function() {
      Scene_MenuBase.prototype.initialize.call(this);
  };

  // core creation function of the Difficulty scene.
  Scene_SDP.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createCommandWindow();   // the list of distribution panels.
    this.createHelpWindow();      // the description of the panel.
  };

  // the list of distribution panels based on the character.
  Scene_SDP.prototype.createCommandWindow = function() {
    // make the list of SDP from the actor, here.
  };

  Scene_SDP.prototype.createHelpWindow = function() {
    // draw the description of the panel selected, here.
  };

  /* -------------------------------------------------------------------------- */
  // handle window generation here.

  function Window_SDP_List() { this.initialize.apply(this, arguments); }
  Window_SDP_List.prototype = Object.create(Window_Selectable.prototype);
  Window_SDP_List.prototype.constructor = Window_SDP_List;

  Window_SDP_List.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._actor = null;
    this.refresh();
  };

  Window_SDP_List.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
    }
  };
  Window_SDP_List.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    // do update things
  };

  

})(J.SD);
