(function(){

  Template.overlay.helpers({
    overlay : function(){
      return Session.get('overlay');
    },
    newTrail: function(){
      return Session.equals('overlay','newTrail');
    },
    viewLibrary: function(){
      return Session.equals('overlay', 'viewLibrary');
    }
  });

  Template.overlay.events({
    'click .close': function(e, t){
      $('#overlay').removeClass('active');
      Meteor.setTimeout(function(){
        Session.set('overlay', null);
      }, 400);
      return false;
    }
  });

  Template.overlay.preserve(['#panel']);

  var makeActive = function(){
    $('#overlay').addClass('active');
  };

  Template.overlay.rendered = function(){
    _.defer(makeActive);
  };


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

  // What should be the process here? 
  // 
  // What I need:
  // - Point of Origin Coordinates
  // - An 'origin' feature
  // - A Name
  // - Publish? By default, a new map won't be 'Published'
  //   even though it will be saved. The user will have to
  //   explicitly 'publish' it, in order for it to be available
  //   to the public. 
  //   
  //   What about editing? With editing, I suppose changes should
  //   just be made live. You can see editing happening in real time
  //   then? 
  //   How should we handle rerendering the user's view when the
  //   data changes, then? We should probably only resize our bounds
  //   if we are in 'editing' mode? Hmm...
  //  


  function addToFavourites(trailId){
    // XXX - Ensure that the Id doesn't already 
    // exist in the favourites array. 
    Meteor.users.update({_id: Meteor.userId()}, {
      '$push' : { 'profile.favourites': trailId }
    });
  }

Template.newTrail.events({

  'submit #new-trail' : function(e, t){
    e.preventDefault();

    var name = t.find('.trail-name').value;

    if (name) {
      var newTrail = Trails.insert({ 
        name : name,
        published: false
      });
      Session.set('currentTrail', newTrail);
      Session.set('mapView', 'detail');
      Session.set('isEditing', true);
      Session.set('overlay', null);
      addToFavourites(newTrail);
    } else {
      // Validation goes here
      console.log('Do some validation');
    }
    return false; 
  }
});

Template.viewLibrary.events({

  'click .trail-name' : function(e, t){
    Session.set('currentTrail', this._id);
    Session.set('mapView', 'detail');
    Session.set('overlay', null);
    return false; 
  }

});

Template.viewLibrary.helpers({
  trails: function(){
    var trailArray = Meteor.user().profile && Meteor.user().profile.favourites;
    return trailArray 
      ? Trails.find({_id: {'$in' : trailArray}}) 
      : false; 
  }
});



})();