//================================================================================
// J_qABS_MapTime
//================================================================================
/*:@plugindesc Provides functionality for HRG/MRG/TRG while on the map.
@author J

@help This plugin adds to the QuasiABS system the functionality of HP/MP/TP
 regeneration.

MATH BREAKDOWN: actor's HRG = 50(%).
  var hpRegen = ((actor.hrg * 100) / 2) / 5;
((0.5 * 100) / 2) / 5
 (50 / 2)  / 5
 25 / 5
 5 per tick (1 tick = 30 frames = 0.5 seconds)

In short, the actor will regenerate 1/10 of whatever his HRG/MRG is, per tick.

NOTE: TRG's regenration is updated 10x faster (1 tick = 3 frames = 0.05s)
  Currently, it is being used as "stamina".

 If you intend to use this, I highly recommend you make use of a couple other
 plugins as well:
   > The actual qABS and its extras: http://quasixi.com/quasi-abs-documentation/
   > A functional HUD: http://pastebin.com/53UjUNiZ
*/
var Imported = Imported || {};
Imported.J_MapTime = true;

// adds in timing variables for monitoring when to tick the regenerations.
var _Game_Map_jMapTime_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function() {
  _Game_Map_jMapTime_initialize.call(this);
  this._timingHPMP = 0;
  this._timingTP = 0;
};

// processes the functions that provide HRG/MRG/TRG on the map.
var _Game_Map_jMapTime_update = Game_Map.prototype.update;
Game_Map.prototype.update = function(sceneActive) {
    _Game_Map_jMapTime_update.call(this, sceneActive);
    this.j_regenOnMap();
};

// Checks if party exists, then performs the onMapFX once per 30 frames.
// Effects are divided into HP+MP, and TP, so that TP can regenerate at
//   a faster rate for purpose of being like "stamina".
Game_Map.prototype.j_regenOnMap = function() {
  if ($gameParty != null) { var actor = $gameParty.leader(); }
  if (actor) {
    if (this._timingHPMP <= 0) {
      this.doHPMPregen(actor);
      this._timingHPMP = 30;
    }
    else { this._timingHPMP--; }
    if (this._timingTP <= 0) {
      this.doTPregen(actor);
      this._timingTP = 3;
    }
    else { this._timingTP--; }
  }
};

// Here, HP/MP regeneration is handled based on HRG/MRG.
// It is significantly slower than TP Regeneration.
// Additionally, it is flat regen, not %max regen.
Game_Map.prototype.doHPMPregen = function(actor) {
  var hpRegen = ((actor.hrg * 100) / 2) / 5;
  var mpRegen = ((actor.mrg * 100) / 2) / 5;
  actor.gainHp(hpRegen);
  actor.gainMp(mpRegen);
};

// this rapidly regenerates the player's TP.
// and also deplete stamina while dashing.
Game_Map.prototype.doTPregen = function(actor) {
  var mod = Game_Player.prototype.isDashButtonPressed() ? 2.5 : 0.0;
  var tpRegen = (((actor.trg + 0.1) * 100) / 10) - mod;
  actor.gainTp(tpRegen);
};

// this forces the player to be unable to run while out of TP.
// note: hopefully this is okay since only actor's can dash (?).
Game_CharacterBase.prototype.realMoveSpeed = function() {
    if ($gameParty != null) { var actor = $gameParty.leader(); }
    return this._moveSpeed + ((this.isDashing() && actor.tp > 0)? 1 : 0);
};

// this fixes the issue of drawing excessively long decimal numbers
// in places like the menu that draw gauges for HP/MP.
var _Window_Base_jqABSHUD_drawCurrentAndMax = Window_Base.prototype.drawCurrentAndMax;
Window_Base.prototype.drawCurrentAndMax = function(current, max, x, y, width, color1, color2) {
  current = current.toFixed(0);
  _Window_Base_jqABSHUD_drawCurrentAndMax.call(this, current, max, x, y, width, color1, color2);
};
