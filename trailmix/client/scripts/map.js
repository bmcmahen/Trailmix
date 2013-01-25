(function(trailmix){

  /**
   * Mapview Class
   * 
   */
  
  var MapView = function(map){

    this.map = map || new L.Map('map', {
      center: new L.LatLng(53.1103, -119.1567),
      zoom: 13,
      layers: new L.TileLayer('http://a.tiles.mapbox.com/v3/bmcmahen.map-75dbjjhk/{z}/{x}/{y}.png')
    }); 
    this.features = L.layerGroup().addTo(this.map);
    this.idToFeatures = {}; 

  }

  _.extend(MapView.prototype, {

    // Create Leaflet features from JSON and add them to 
    // the layerGroup object and our id-to-features hash. 
    addFeature: function(feature) {

      var el; 

      // More types in the future?
      switch(feature.geometry.type) {

        case 'Point':
          el = L.marker(feature.geometry.coordinates)
                .bindPopup(feature.properties.name)
          break;
        
        case 'LineString':
          el = L.polyline(feature.geometry.coordinates, {
            color: 'blue'
          });
          break; 
      }

      if (el) {
        this.features.addLayer(el);
        this.idToFeatures[feature._id] = el; 
      }

      return this; 

    },

    // Use our id-to-features hash to remove certain
    // features from our map. 
    removeFeature: function(feature) {

      var layer = this.idToFeatures[feature._id];
      if (layer) {
        this.features.removeLayer(layer);
        delete this.idToFeatures[feature._id];
      }

      return this; 
    },

    // If our features change, redraw them. 
    updateFeature: function(feature) {

      // Simply remove, and add again. 
      // In the future, I may want to optimize this to update
      // the feature itself using setLatLng, setIcon, etc. 
      this.removeFeature(featurs).addFeature(feature);
      return this; 
    },

    // Show all of our features on the map at maximum size.
    fitBounds: function(){

      this.map.fitBounds(this.features.getBounds());

    }

  });


/**
 * MapView Rendered Callback
 */

  Template.mapView.rendered = function(){

    // Set Map Height
    
    $('#map').height($(window).height() - 80);

     var trailMap = new MapView(); 

     // expose our map object as a global variable. 
     trailmix.map = trailMap; 

    // When our Collection changes, update the map. 
    var trailQuery = Features.find({
      trail: Session.get('currentTrail'
    )})
     
     this.handle = trailQuery.observe({

      added: function(document, beforeIndex){
        trailMap.addFeature(document);
      },

      changed: function(newDocument, atIndex, oldDocument){
        trailMap.updateFeature(newDocument);
      },

      removed: function(oldDocument, atIndex){
        trailMap.removeFeature(oldDocument);
      }

     });

  };

  Template.mapView.destroyed = function(){
    this.handle && this.handle.stop(); 
  }

})(Trailmix);


