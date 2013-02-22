
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
  // find({coordinates[0]})

});

/**
 *
 * Publish
 * 
 */

// Only publish features that belong to a specific trail. 
Meteor.publish('features', function(trailId){
  return Features.find({ trail: trailId });
});

// Publish those trails within the bounds of the map view.
Meteor.publish('trails', function(bounds){
  if (bounds && bounds.southWest && bounds.northEast) {
    return Trails.find({'coordinates': {'$within' : 
      { '$box' : [bounds.southWest, bounds.northEast] }
    }}, {
      limit: 100
    });
  }
});

// Publish trails that are the current user's favourites.
Meteor.publish('trailFavourites', function(usr){
  if (usr){
   var trailArray = usr.profile && usr.profile.favourites;
   if (trailArray)
    return Trails.find({_id: {'$in' : trailArray }});
  }
});

