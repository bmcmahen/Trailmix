(function(trailmix){

  /**
   * 
   * MapView Prototype
   *
   * Controls Interaction between Leaflet and Meteor
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
      this.map.invalidateSize(true);
      return this; 
    },

    // When clicked, highlight the feature in the DOM
    // Maybe change its color to indicate that it's clicked?
    onMarkerClick: function(e) {
      Session.set('selectedFeature', e.target._id);
      this.focusListElement(e);
    },

    // When clicked, highlight the feature in the DOM
    onLineStringClick: function(e){
      Session.set('selectedFeature', e.target._id);
      this.focusListElement(e);
      // if in splice mode
      // feature.spliceLatLngs()
      // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/splice
    },

    // If we are looking at our features pane, scroll to the 
    // selected element. 
    focusListElement: function(e){
      if (Session.equals('tabView', 'features') && Session.get('isEditing')) {
        var $container = $('#edit-tabs-content')
          , $target = $('#' + e.target._id);

        $container.animate({
          scrollTop: $target.offset().top - $container.offset().top + $container.scrollTop()
        }, 500);
      }
    },

    // When a marker has been dragged into a spot, save it. 
    onDragEnd: function(e) {
      var feature = e.target
        , latLng = feature.getLatLng(); 

      Features.update({_id: feature._id}, {'$set' : {
        'geometry.coordinates' : [latLng.lat, latLng.lng]
        }
      });

    },

    highlightFeature: function(id){
      var feature = this.idToFeatures[id];
      // Do we need a separate function for polylines?
      this.map.panTo(feature.getLatLng());
    },

    // Edit a given marker
    editMarker: function(feature){
      feature.dragging.enable();
    },

    // Disable editing a given marker
    disableEditMarker: function(feature){
      feature.dragging.disable(); 
    },

    // Edit a given polyline
    editPolyline: function(feature){
      feature.editing.enable();
      this.map.fitBounds(feature.getBounds());
    },

    // Disable editing a given polyline
    disableEditPolyline: function(feature){
      feature.editing.disable();
    },

    // Determine which feature type, and set that feature
    // into the correct editing mode. 
    editFeature: function(feature){
      var el = this.idToFeatures[feature._id]
        , type = feature.geometry.type;

      if (this.currentlyEditing)
        this.disableEditFeature();

      this.currentlyEditing = feature; 

      Session.set('selectedFeature', feature._id);
      type === 'Point' 
        ? this.editMarker(el) 
        : this.editPolyline(el);
    },

    // Disable editing mode for the currently edited feature.
    disableEditFeature: function(){
      var feature = this.currentlyEditing
        , el = this.idToFeatures[feature._id]
        , type = feature.geometry.type;

      delete this.currentlyEditing; 

      type == 'Point'
        ? this.disableEditMarker(el)
        : this.disableEditPolyline(el);
    },

    // Determine which icon should be applied to the feature
    determineIcon: function(feature){
      var iconProperties = { iconUrl: '/map_icons/marker-icon.png' }
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

    // Simplify our polyline so that it's a little less complicated.
    // This should only be done when converting GPX to GeoJSON
    // so that we can store the simplified data-set into the database.
    // Let Leaflet handle the drawing. 
    
    simplifyPolyline: function(coordinates){

      // Convert each feature into a point.
      var pts = _.map(coordinates, function(latlng, i){
        var l = new L.LatLng(latlng[0], latlng[1]);
        return this.map.options.crs.latLngToPoint(l, 15)._round();
      }, this);

      // Simplify the points.
      var simplified = L.LineUtil.simplify(pts, 1.8);

      // Convert back into latlngs.
      return _.map(simplified, function(pt, i){
        var latlng = this.map.options.crs.pointToLatLng(pt, 15);
        return [latlng.lat, latlng.lng];
      }, this);

    },

    // Create Leaflet features from JSON and add them to 
    // the layerGroup object and our id-to-features hash. 
  
    addFeature: function(feature) {
      var el, geom = feature.geometry; 

      // More types in the future?
      switch(geom.type) {

        case 'Point':
          el = this.createMarker(feature, {
            riseOnHover: true
          });
          break;
        
        case 'LineString':
          el = L.polyline(geom.coordinates, {
            color: 'rgb(33, 47, 151)',
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
      this.removeFeature(feature).addFeature(feature);
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

    // Toggle the edit-mode of the map. 
    toggleEditing: function(){
      if (Session.get('isEditing')) {
        this.$el.addClass('editing');
      } else {
        this.$el.removeClass('editing');
      }
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


