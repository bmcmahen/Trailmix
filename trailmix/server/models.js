
/**
 *
 * Collections
 *
 */

Features = new Meteor.Collection('features');
Trails = new Meteor.Collection('trails');

/**
 * Ensure Indexes
 */

Meteor.startup(function(){
  Trails._ensureIndex({coordinates: '2d'});
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

