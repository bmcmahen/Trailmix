(function(Trailmix, sax){

  // Expose our utility functions to the world.
  var Utils = Trailmix.Utils = {};

  /**
   * [GPXtoGeoJSON converts a gpx string into (roughly) GeoJSON]
   * @param {[type]}   gpxString [xml gpx string]
   * @param {Function} callback  [return with json]
   */
  
  // XXX Eventually make a Parser class, which allows us to
  // convert among many different formats. GPX, KML, GeoJSON, 
  // and back again. 
  Utils.GPXtoGeoJSON = function(gpxString, callback) {

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
      if (!aFeatureType && !feature) return
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
    };

    parser.onclosetag = function(tagName){
      // If it's the feature name, then push the
      // feature object to our array
      if (tagName === featureName){
        // Make sure we simplify the trk coordinates. This is mostly for performance
        // reasons. Notably, 'edit polyline mode' slows to a crawl if 
        // we don't do anything. 
        if (featureName === 'trk') {
          var simplify = _.bind(Trailmix.map.simplifyPolyline, Trailmix.map)
            , newCoords = simplify(feature.geometry.coordinates);

          feature.geometry.coordinates = newCoords; 
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
    };

    parser.ontext = function(text) {
      if (!currentTag || !text) return
      if (!_.contains(desiredProperties, currentTag.name)) return
      // Add text and their tags to the properites object
      if (feature) {
        var txt = {};
        txt[currentTag.name] = text; 
        _.extend(feature.properties, txt);
      }
    };

    parser.onend = function(){
      callback(features);
    };

    parser.write(gpxString).close();
  };

})(Trailmix, sax);