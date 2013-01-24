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
        feature.geometry.coordinates.push([ attr.lat, attr.lon]);

        if (featureName === 'wpt')
          _.flatten(feature.geometry.coordinates);

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
          var coords = feature.geometry.coordinates
          , result = simplify(coords, 1);

          feature.geometry.coordinates = result; 
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



  Template.sideBar.events({

    'submit #add-trail-form' : function(e, t) {
      var name = t.find('#add-trail-name').value
        , files = t.find('#add-trail-file').files;

      // Read files using the FileReader, and convert
      // it to a String. Send that string to be parsed.
      // XXX -- Need filechecking here, and safe failures.
      if (files && window.FileReader) {
        var reader = new FileReader();

        // This should probably go into a webworker
        reader.onload = function(e){

          var xml = e.target.result;
          GPXtoGeoJSON(xml, function(json){
            console.log(json);
          });

        }

        reader.onerror = function(err){
          console.log('err', err);
        }

        reader.readAsText(files[0]);
      }
      
      return false; 
    }
  })

})(Trailmix, sax);