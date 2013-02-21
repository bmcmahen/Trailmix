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


})();