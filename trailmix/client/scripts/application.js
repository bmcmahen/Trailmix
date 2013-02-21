
// Namespace
Trailmix = {};

// Models
Features = new Meteor.Collection('features');
Trails = new Meteor.Collection('trails');

// Our reative model for our  map bounds. It contains two sets
// of coordinates which are updated by our leaflet map. When
// an update occurs, our Trail subscription will automatically 
// update to retrieve the trails that exist within these bounds. 
// On the server, we will use Mongo's $within to query for the 
// appropriate trails, and when our subscription updates, so will
// our leaflet map (via an observer + leaflet controller).
MapBounds = new Meteor.Collection(null);

/**
 * Subscriptions
 */

Meteor.subscribe('trails');

Meteor.autosubscribe(function () {
  Meteor.subscribe('features', Session.get('currentTrail'));
});

/**
 * Session Variables
 */

Session.set('currentTrail', null);
Session.set('isEditing', false);
Session.set('selectedFeature', null);