
/**
 *
 * Collections
 * 
 */

Features = new Meteor.Collection('features');
Trails = new Meteor.Collection('trails');


Meteor.startup(function(){
  // Ensure index, and our 'trails' publish function will
  // be linked to the current mapBounds(), which will initially
  // be set based on geoLocation. 
  // 
  // The reactive datasource (local collection?) inside of our subscribe function
  // will be an array containing the current bounds of the
  // map. As our map changes, we will update this reactive
  // data source, which will update our subscription, which will
  // draw the newly received trails onto the map, and remove
  // the ones no longer on the map. 
  // 
  // We'll use the marker cluster to avoid bazilions of
  // trails appearing on the map at once. We should probably also
  // limit our subscription to a certain number of trails,
  // so as not to kill our app. 
  // 
  // Trails._ensureIndex({'coordinates': '2d'});
  // var results = Trails.find({'coordinates': {'$within' : { '$box' : [[0,0], [3,3]]}}}).fetch();
});

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
// Only publish current trail & favourites?
Meteor.publish('trails', function(){
  return Trails.find();
});

