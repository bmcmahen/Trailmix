/**
 * Navbar links
 */

(function(){

  var Modal = require('bmcmahen-modal')
    , newTrailModal, myTrailModal;

  function addToFavourites(trailId){
    // XXX - Ensure that the Id doesn't already 
    // exist in the favourites array. 
    Meteor.users.update({_id: Meteor.userId()}, {
      '$push' : { 'profile.favourites': trailId }
    });
  }

  Template.navLinks.events({

    'click #create-new-trail' : function(e, t) {
      newTrailModal = Modal('#add-new-trail-modal').show();
      return false; 
    },

    'click #view-my-trails' : function(e, t) {
      myTrailModal = Modal('#view-my-trails-modal').show();
      return false; 
    }

  });

/**
 * Modals
 */

Template.modals.helpers({

  // Check if the user has favourites and if so, return those. 
  trails : function(){
    var trailArray = Meteor.user().profile && Meteor.user().profile.favourites;
    return trailArray 
      ? Trails.find({_id: {'$in' : trailArray}}) 
      : false; 
  }

});

Template.modals.events({

  'submit #new-trail' : function(e, t){
    e.preventDefault();

    var name = t.find('.trail-name').value;

    if (name) {
      var newTrail = Trails.insert({ name : name });
      Session.set('currentTrail', newTrail);
      Session.set('isEditing', true);
      addToFavourites(newTrail);
      newTrailModal.hide(); 

    } else {
      // Validation goes here
      console.log('Do some validation');
    }
    return false; 
  }
});

Template.myTrails.events({

  'click .my-trail' : function(e, t){
    Session.set('currentTrail', this._id);
    myTrailModal.hide(); 
    return false; 
  }

});






})();