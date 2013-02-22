/**
 * Navbar links
 * 
 */

(function(){

  Template.navLinks.events({

    'click #create-new-trail' : function(e, t) {
      Session.set('overlay', 'newTrail');
      return false; 
    },

    'click #view-my-trails' : function(e, t) {
      Session.set('overlay', 'viewLibrary');
      return false; 
    }

  });

  Template.navigation.helpers({
    loading: function(){
      return Session.get('loading');
    }
  });

  // Canvas Loading Animation
Template.loading.rendered = function(){
  var loading = require('bmcmahen-canvas-loading-animation')
    , spinner = new loading({
        color: '220, 220, 220',
        width: 40,
        height: 40,
        radius: 9,
        dotRadius: 1.8
      });

  this.find('#loading-wrapper').appendChild(spinner.canvas);
};

})();