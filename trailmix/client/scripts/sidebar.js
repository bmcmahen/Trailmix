(function(Trailmix, sax){

  /**
   * [GPXtoGeoJSON converts a gpx string into GeoJSON]
   * @param {[type]}   gpxString [xml gpx string]
   * @param {Function} callback  [return with json]
   */
  
  var GPXtoGeoJSON = function(gpxString, callback){

    // Ensure that we have a string
    if (!_.isString(gpxString))
      gpxString = gpxString.toString('utf8');

    var types = { 'wpt' : 'Point', 'trk' : 'LineString' }
      , desiredProperties = ['ele', 'name', 'sym', 'desc', 'type']
      , featureTypes = ['wpt', 'trk']
      , parser = sax.parser(true)
      , features = []
      , feature = null
      , currentTag = null
      , featureName = null;

    parser.onopentag = function(tag){

      var aFeatureType = _.contains(featureTypes, tag.name);

      // If it's not a feature type, or we aren't already in
      // one, then ignore it. 
      if (!aFeatureType && !feature)
        return

      // If it is a feature type, then create our feature
      // object. 
      if (aFeatureType) {      
        feature = {
          type: 'Feature',
          geometry: {
            type: types[tag.name],
            coordinates: []
          },
          properties: {}
        };
        featureName = tag.name;
      }

      var attr = tag.attributes;
      if (attr && attr.lat && attr.lon && feature) {

        feature.geometry.coordinates.push([ +attr.lat, +attr.lon]);

        if (featureName === 'wpt') {
          feature.geometry.coordinates = feature.geometry.coordinates[0];
        }

      }

      // If we have a currentTag, set the parent attribute
      // of this tag to be it. 
      tag.parent = currentTag; 
      tag.children = [];
      tag.parent && tag.parent.children.push(tag);
      currentTag = tag; 

    }

    parser.onclosetag = function(tagName){

      // If it's the feature name, then push the
      // feature object to our array
      if (tagName === featureName){

        // I'll need to determine if I actually need a simpliciation algorithm, or 
        // whether or not I should just let leaflet handle this for drawing purposes. 
        // For now, I'll have a fail-safe, so if it's over 10000 points (which should be
        // ver unusual) I'll run simplification functions. 
        if (featureName === 'trk' && feature.geometry.coordinates.length > 10000) {
          // var coords = feature.geometry.coordinates
          // , result = simplify(coords, 1);

          // feature.geometry.coordinates = result; 
        }

        features.push(feature);
        currentTag = feature = null;
        return
      }

      // If our currentTag has a parent, then
      // set the currentTag to be that parent. 
      if (currentTag && currentTag.parent) {
        var p = currentTag.parent;
        delete currentTag.parent;
        currentTag = p; 
      }
    }

    parser.ontext = function(text) {
      if (!currentTag || !text)
        return

      if (!_.contains(desiredProperties, currentTag.name))
        return

      // Add text and their tags to the properites
      // object.
      if (feature) {
        var txt = {};
        txt[currentTag.name] = text; 
        _.extend(feature.properties, txt);
      }
    }

    parser.onend = function(){
      callback(features);
    }

    parser.write(gpxString).close();

  }


  // Take an array of features, and insert them into the database
  // with the currentTrail _id as the trail attribute. This should
  // update our trail automatically. 
  var createFeatures = function(json){
    _.each(json, function(feature, i){
      _.extend(feature, {trail : Session.get('currentTrail')});
      Features.insert(feature);
    });
  }


  Template.sideBar.rendered = function(){

    // Meteor doesn't handle universal events very well,
    // so we handle them here. 
    $(window).on('dragover', function(e){
      e.preventDefault(); 
      $('#features').addClass('dragover');
    });

    $(window).on('dragleave', function(e){
      $('#features').removeClass('dragover');
    });

    $(window).on('drop', function(e){
      e.preventDefault();
    });

  };

  Template.sideBar.destroyed = function(){

    // Unbind our window events
    $(window).off('dragover, dragleave, drop');

  }

  Template.sideBar.events({

    'dragover #features' : function(e, t) {
      e.preventDefault(); 
      $(e.currentTarget).addClass('dragover');
    },

    'dragleave #features' : function(e, t) {
      $(e.currentTarget).removeClass('dragover');
    },

    // convert a gpx file into features on drop
    'drop #features' : function(e, t) {
      e.preventDefault();
      $(e.currentTarget).removeClass('dragover');
      
      var files = e.dataTransfer.files;

      if (!files || !window.FileReader)
        return 

      var reader = new FileReader();
      reader.onload = function(e){
        GPXtoGeoJSON(e.target.result, function(json){
          createFeatures(json);
        });
      };

      reader.readAsText(files[0]);

    },

    // remove a feature
    'click .delete-feature' : function(e, t) {
      Features.remove(this._id);
    },

    // enter editing mode
    'click .edit-trail' : function(e, t) {
      Session.set('isEditing', true);
    },

    // exit editing mode
    'click .finish-editing' : function(e, t) {
      Session.set('isEditing', false);
    },

    // Update the trail name and description. 
    'submit #trail-info' : function(e, t) {

      e.preventDefault(); 

      var name = t.find('.name').value
        , desc = t.find('.description').value; 

      Trails.update({_id: this._id}, {'$set' : { 
        name: name,
        description: desc
      }}); 

      return false;
    }

  });


  Template.sideBar.helpers({

    // our selected trail's features
    features: function() {
      if (Session.get('currentTrail'))
        return Features.find({trail: Session.get('currentTrail')});
    },

    // our selected trail
    trail : function(){
      var current = Session.get('currentTrail');
      return current && Trails.findOne(current);
    },

    // whether we are in edit mode or not
    isEditing : function() {
      return Session.get('isEditing');
    }
  });

})(Trailmix, sax);