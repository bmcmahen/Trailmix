(function(trailmix){

  /**
   * Mapview Class
   * 
   */
  
  var MapView = function(map){

    this.$el = $('#map');
    this.map = map || new L.Map('map', {
      center: new L.LatLng(53.1103, -119.1567),
      zoom: 13,
      layers: new L.TileLayer('http://a.tiles.mapbox.com/v3/bmcmahen.map-75dbjjhk/{z}/{x}/{y}.png')
    }); 
    this.features = L.featureGroup().addTo(this.map);
    this.idToFeatures = {}; 

    this.resizeMap(); 

  }

  _.extend(MapView.prototype, {

    resizeMap: function(){
      this.$el.height($(window).height() - 80);
      this.map.invalidateSize(true);
    },

    // When clicked, highlight the feature in the DOM
    // Maybe change its color to indicate that it's clicked?
    onMarkerClick: function(e) {
      var feature = e.target; 
    },

    // When clicked, highlight the feature in the DOM
    onLineStringClick: function(e){
      var feature = e.target; 
      // if in splice mode
      // feature.spliceLatLngs()
      // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/splice
    },

    onDragEnd: function(e) {
      var feature = e.target
        , latLng = feature.getLatLng(); 

        console.log(latLng);

      Features.update({_id: feature._id}, {'$set' : {
        'geometry.coordinates' : [latLng.lat, latLng.lng]
        }
      });
    },

    // Enable marker dragging in edit mode
    enableMarkerDragging: function(){
      this.features.eachLayer(function(layer){
        layer.dragging && layer.dragging.enable(); 
      });
    },

    // Disable marker dragging in edit mode
    disableMarkerDragging: function(){
      this.features.eachLayer(function(layer){
        layer.dragging && layer.dragging.disable(); 
      });
    },

    determineIcon: function(feature){
      var iconProperties = {
        iconUrl: '/map_icons/marker-icon.png'
      }

      switch(feature.properties.sym.toLowerCase()){
        case 'trail head':
          _.defaults({
            iconSize: [40, 90]
          }, iconProperties);
          break; 
      }

      return L.icon(iconProperties);
    },

    // By default, use a circle marker for trail intersections.
    // if feature.properties.sym is specified, then use
    // a custom icon. Say, for a campground. 
    createMarker: function(feature){
      var self = this
        , coords = feature.geometry.coordinates
        , sym = feature.properties.sym;

      function circleMarker(){
        return L.circleMarker(coords, {
          stroke: false,
          radius: 4,
          fill: true,
          fillColor: 'black',
          fillOpacity: 1
        });
      }

      function regularMarker(){
        return L.marker(coords, {
          icon: self.determineIcon(feature)
        });
      }

      var el = sym ? regularMarker() : circleMarker();
      el.on('click', _.bind(this.onMarkerClick, this));
      el.on('dragend', _.bind(this.onDragEnd, this));

      return el; 
    },

    // Create Leaflet features from JSON and add them to 
    // the layerGroup object and our id-to-features hash. 
    addFeature: function(feature) {
      var el, geom = feature.geometry; 

      // More types in the future?
      switch(geom.type) {

        case 'Point':
          el = this.createMarker(feature);
          break;
        
        case 'LineString':
          el = L.polyline(geom.coordinates, {
            color: 'blue',
            opacity: 1,
            weight: 2.5,
            dashArray: '8, 5'
          });
          el.on('click', _.bind(this.onLineStringClick, this));
          break; 
      }

      if (el) {

        // Set an _id attribute to the element so that we can
        // later update the database document. 
        el._id = feature._id; 
        this.features.addLayer(el);

        // If we are editing, make sure that we enable marker
        // dragging and dropping. 
        if (Session.get('isEditing')) {
          el.dragging && el.dragging.enable();
        }
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

    removeAllFeatures: function(){
      this.features.clearLayers();
      this.idToFeatures = {}; 
    },

    // If our features change, redraw them. 
    updateFeature: function(feature) {
      // Simply remove, and add again. 
      // In the future, I may want to optimize this to update
      // the feature itself using setLatLng, setIcon, etc. 
      this.removeFeature(features).addFeature(feature);
      return this; 
    },

    fitBounds: function(){
      if (this.features)
        this.map.fitBounds(this.features.getBounds());
    },

    // Show all of our features on the map at maximum size.
    delayFitBounds: function(){
      // Use a timer to only update the map once all of the
      // new features have been added.
      this.timer && clearInterval(this.timer);
      this.timer = setTimeout(_.bind(this.fitBounds, this), 300); 

    },

    toggleEditing: function(){
      Session.get('isEditing') 
        ? this.enableMarkerDragging()
        : this.disableMarkerDragging(); 
    }

  });

// If editing, automatically enable certain interactive
// features with our map. 
Meteor.autorun(function(){
  Session.get('isEditing');
  trailmix.map && trailmix.map.toggleEditing();
});

// Resize the map based on window size
function resizeMap(){
  $('#map').height($(window).height() - 80);
  trailmix.map && trailmix.map.fitBounds(); 
}

/**
 * MapView Rendered Callback
 */

  Template.mapView.rendered = function(){

    // Create Map
    var trailMap = new MapView(); 

    // Attach it to our global variable
    trailmix.map = trailMap; 

    // When resizing the window, resize the map
    var resizeMap = _.bind(trailMap.resizeMap, trailMap);
    $(window).on('resize', _.debounce(resizeMap, 100));

    // Run an observe query  on whatever trail
    // we are currently viewing.
    Meteor.autorun(function() {

      // If a trail has previously been selected
      // then stop observing it, remove the map features
      // and make a new query with the new trail. 
      if (this.handle) {
        this.handle.stop();
        trailMap.removeAllFeatures(); 
      }

      this.trailQuery = Features.find({
        trail: Session.get('currentTrail')
      });

      this.handle = trailQuery.observe({
        added: function(document){
          console.log('added called');
          trailMap.addFeature(document).delayFitBounds();
        },
        changed: function(newDocument, index, oldDocument) {
          // I don't understand why this is necessary. But
          // changed seems to be fired on newly created
          // documents that are part of this query. This
          // means that changed & added are both fired. But
          // if I compare newDocument and oldDocument, they
          // are the same. 
          if (! _.isEqual(newDocument, oldDocument)) {
            console.log('we need to update this', newDocument, oldDocument);
          }
          
        },
        removed: function(oldDocument) {
          trailMap.removeFeature(oldDocument);
        }
      });

    });

   

  };

  Template.mapView.destroyed = function(){
    this.handle && this.handle.stop(); 
  }

})(Trailmix);


