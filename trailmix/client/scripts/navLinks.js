/**
 * Navbar links
 */

(function(){

  Template.navLinks.events({

    // XXX - This should open a popup window, with a form for
    // the new trail name, and a 'create' button. 
    // Each new trail should then have a publish option, that,
    // once clicked, makes it available to everyone. This ensures
    // that half-assed, incomplete trails don't make it into
    // the search. 
    'click #create-new-trail' : function(e, t) {
      Session.set('currentTrail', Trails.insert({}));
      return false; 
    }

  });

})();