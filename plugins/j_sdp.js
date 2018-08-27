let J = J || {};
J.SD = J.SD || {};

let Imported = Imported || {};
Imported["JE Stat Distribution Panels"] = "0.1.0";

/* Creating generic methods for various things not specific to any particular method
  with the RMMV rpg_*.js files. */

// Creates and returns a "panel" for use to upgrade with points.
// This panel is pushed into a given player's panel list.
J.SD.MakePanel = (cat = 0, fp = "flat", ea = 5, max = 10, cur = 0, cmult = 1.2, cgrow = 50) => {
  let panel = {
    category: cat,      // some parameter
    flatOrPercent: fp,  // flat/percent increase/decrease decision.
    perRank: ea,        // how much the increase/decrease is.
    rankMax: max,       // some number that defines how high it can go; 0 if infinite.
    rankCur: cur,         // always 0; increments +1 per rank up.
    cost: () => { // the cost formula, based on rankCur.
      if (rankCur === rankMax) return 0;
      return Math.floor(cmult * (cgrow * (this.rankCur + 1)));
    },

  }; 
  return panel;
};


((_) => { "use strict";
  // hook into param + paramBase + paramPlus + clearParamPlus
  // add in the stat distribution points

  // hook into game_actor
  // add in the necessary variables
  _.sdpInit = Game_Actor.prototype.initMembers
  Game_Actor.prototype.initMembers = function() {
    _.sdpInit.call(this, this); 
    this._sdpCollection = []; // the collection of panels will be in here.
    this._sdpPts = 0; // how many points you have to be distributed across your panels.
  };
  
  // create the stat distribution panel framework

  // add/subtract distribution points.
  Game_Actor.prototype.SDP_modPoints = pts => {
    // add the points, negative or positive, to the current amount.
    this._sdpPts += pts;
    // make sure points are never lower than zero by this function.
    if (this._sdpPts < 0) this._sdpPts = 0;
  };

  // add panel to an actor of a type
  Game_Actor.prototype.SDP_addPanel = (panel) => {
    this._sdpCollection.push(panel);
  }


  // create the ui/menu for sdp

}, J.SD)
