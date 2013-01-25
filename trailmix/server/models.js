
/**
 *
 * Collections
 * 
 */

Features = new Meteor.Collection('features');
Trails = new Meteor.Collection('trails');


/**
 *
 * Publish
 * 
 */

// Only publish features that belong to a
// specific trail. 
Meteor.publish('features', function(trailId){
  return Features.find({ trail: trailId });
});

// XXX Shouldn't publish all trails.
Meteor.publish('trails', function(){
  return Trails.find();
});