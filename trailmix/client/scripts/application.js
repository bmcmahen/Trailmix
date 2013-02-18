
// Namespace
Trailmix = {};

// Models
Features = new Meteor.Collection('features');
Trails = new Meteor.Collection('trails');

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