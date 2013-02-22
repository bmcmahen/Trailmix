
// Namespace
Trailmix = {};

// Models
Features = new Meteor.Collection('features');
Trails = new Meteor.Collection('trails');

// Our client-side only reactive model containing our
// map bounds (southWest, northEast). This is used to update
// our subscription to the trails that are in the current map
// bounds. 
MapBounds = new Meteor.Collection(null);

/**
 * Subscriptions
 */

// Get trails that are located within our map bounds. 
Meteor.autorun(function () {
  Session.set('loading', true);
  Meteor.subscribe('trails', MapBounds.findOne(), function(){
    Session.set('loading', false);
  }); 
});

// Get the features of our current trail.
Meteor.autorun(function () {
  Session.set('loading', true);
  Meteor.subscribe('features', Session.get('currentTrail'), function(){
    Session.set('loading', false);
  });
});

// Get the current user's favourite trails. 
Meteor.autorun(function () {
  Meteor.subscribe('trailFavourites', Meteor.user());
});

/**
 * Session Variables
 */

Session.setDefault('currentTrail', null);
Session.setDefault('isEditing', false);
Session.setDefault('selectedFeature', null);
Session.setDefault('mapView', 'browse');