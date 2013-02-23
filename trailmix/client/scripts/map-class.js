Trailmix.MapView = (function(){
  
  // Meteor Observer -> Leaflet Controller/View
  // 
  // Keeps a dict of _id to Feature elements, which we can
  // use to map objects to their elements. Each element also
  // is built with a _id attribute, allowing us to go back the other way.
  var MapView = function(){
    this.map = new L.Map('map', {
      center: new L.LatLng(53.1103, -119.1567),
      zoom: 10,
      // layers: new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
      layers: new L.TileLayer('http://a.tiles.mapbox.com/v3/bmcmahen.map-75dbjjhk/{z}/{x}/{y}.png'),
      maxZoom: 15
    });
    L.control.scale().addTo(this.map);
    this.features = L.featureGroup().addTo(this.map);
    this.idToFeatures = {};
    this.determineMapMode();
  };

  _.extend(MapView.prototype, {

    // Different Modes
    // 
    // MapView is controlled by Session variable 'mapView'
    // and can either be 'detail' or 'browse'.
    determineMapMode: function(){
      var _this = this; 
      if (this.determineMode) this.determineMode.stop();
      this.determineMode = Meteor.autorun(function(){
        if (Session.equals('mapView', 'detail'))
          _this.enterTrailDetailMode();
        else if (Session.equals('mapView', 'browse'))
          _this.enterTrailBrowseMode();
      });
    },
    // 
    // We can either be in 'Trail Detail Mode' or 'Trail Browse Mode'. These
    // functions help us swap between the two. 
    enterTrailDetailMode: function(){
      this.detailMode = true;
      this.removeAllFeatures();

      // Unbind TrailBrowse Events
      this.map
        .off('moveend')
        .off('locationfound');
      this.observeTrailFeatures();
    },

    enterTrailBrowseMode: function(){
      // Either acquire the currentLocation of the user, or, if
      // they have navigated to another location, remember that, and 
      // zoom back to that location. 
      this.detailMode = false; 
      this.removeAllFeatures();
      // Bind TrailBrowse Events
      this.map
        .on('moveend', _.bind(this.onViewChange, this))
        .on('locationfound', _.bind(this.onLocationFound, this));

      if (this.browseLocation) {
        this.browseZoom = this.browseZoom || 12;
        this.map.setView(this.browseLocation, this.browseZoom);
      } else {
        this.map.locate();
      } 

      this.observeTrails();
    },

    // Observe
    // 
    // When in 'Trail Detail Mode' we want to observe the selected trail.
    observeTrailFeatures: function(){
      var _this = this; 
      if (this.autorun)
        this.autorun.stop(); 

      this.autorun = Meteor.autorun(function() {
        if (_this.handle){
          _this.handle.stop();
          _this.removeAllFeatures();
        }

        var query = Features.find({
          trail: Session.get('currentTrail')
        });
        
        _this.handle = query.observe({
          added: function(doc) { 
            _this.addFeature(doc).delayFitBounds();
          },
          changed: function(newDocument, oldDocument) {
            if (!_.isEqual(newDocument, oldDocument)) {
              console.log('we need update this document');
            }
          },
          removed: function(oldDocument) { 
            _this.removeFeature(oldDocument); 
          }
        });

      })
    },

    // When in 'Trail Browse Mode' we want to observe our
    // Trail subscription.
    observeTrails: function(){
      var _this = this; 
      if (this.autorun)
        this.autorun.stop();

      this.autorun = Meteor.autorun(function() {
        if (_this.handle){
          _this.handle.stop();
          _this.removeAllFeatures();
        }

        var query = Trails.find();
        _this.handle = query.observe({
          added: function(doc) { 
            _this.addFeature(doc); 
          },
          changed: function(newDoc, oldDoc) {
            console.log('we need to update position of trail');
          },
          removed: function(oldDoc){ 
            _this.removeFeature(oldDoc); 
          }
        });
      });
    },

    // Events
    // 
    onViewChange: function(e){
      var bounds = this.map.getBounds()
        , boundObject = { 
            southWest: [bounds._southWest.lat, bounds._southWest.lng],
            northEast: [bounds._northEast.lat, bounds._northEast.lng] 
          };

      if (MapBounds.find().count() < 1) MapBounds.insert(boundObject);
      else MapBounds.update({}, boundObject);

      this.browseLocation = this.map.getCenter();
      this.browseZoom = this.map.getZoom();
    },

    onLocationFound: function(e){  
      this.map.setView(e.latlng, 12);
    },

    // Handle Observe -> Map data synchronization.
    // 
    addFeature: function(doc){
      var newFeature = Trailmix.Feature(doc, { map : this })
        , el = newFeature.el;

      if (newFeature) {
        this.idToFeatures[doc._id] = newFeature;
        this.features.addLayer(el);
        if (el._label && el._label.options.noHide)
          el.showLabel();
      }
      return this; 
    },

    // Remove Feature & Remove Trail are basically the same, except
    // for 'features' contains a different kind of object. I should
    // eventually make this perform the same, which would allow 
    // better code reuse. 
    removeFeature: function(doc){
      var feature = this.idToFeatures[doc._id];
      if (feature) {
        this.features.removeLayer(feature.el);
        delete this.idToFeatures[doc._id];
      }
      return this;
    },

    updateFeature: function(doc){
      this.removeFeature(doc).addFeature(doc);
    },

    removeAllFeatures: function(){
      if (this.features && this.idToFeatures){
        this.features.clearLayers();
        this.idToFeatures = {};
      }
    },

    // Basic map functions
    // 
    fitBounds: function(){
      if (this.features) {
        this.map.fitBounds(this.features.getBounds());
      } else {
        var currentTrail = Trails.findOne(Session.get('currentTrail'));
        if (currentTrail.coordinates){
          this.map
            .panTo(currentTrail.coordinates)
            .setZoom(12);  
        }
      }
    },

    // Wait until all of the features have loaded before 
    // we determine our new map bounds.
    delayFitBounds: function(){
      this.timer && clearInterval(this.timer);
      this.timer = setTimeout(_.bind(this.fitBounds, this), 300); 
    },

    resizeMap: function(){
      this.map.invalidateSize(true);
      return this;
    },

    // XXX also allow adding a marker
    addDrawingControls: function(){
      // L.Draw.Polyline();
      this.draw = new L.Polyline.Draw(this.map, {title: 'Draw a line.'});
      this.map.on('draw:poly-created', _.bind(this.onFeatureCreated, this));
      this.draw.on('activated', function(e){
        console.log('drawing controls activated');
      });
      this.map.on('drawing', function(){
        console.log('drawing is happening');
      });
      this.draw.enable();
    },

    highlightFeature: function(id){
      var highlighted = this.currentlyHightlighted;
      if (highlighted) highlighted.disableHighlight();
      this.currentlyHightlighted = this.idToFeatures[id].highlight();
    },

    // Editing States
    // 
    editFeature: function(doc) {
      var el = this.idToFeatures[doc._id];

      if (this.currentlyEditing)
        this.currentlyEditing.disableEditing();

      this.currentlyEditing = el; 
      el.enableEditing(); 
    },

    disableEditFeature: function(doc) {
      this.idToFeatures[doc._id].disableEditing();
      delete this.currentlyEditing;
    },

    onFeatureCreated: function(e){
      // XXX - it might be easier if I use the {lat: , lng: }
      // format over the array format. Seems to be the more standard
      // approach in both leaflet and mongo. 
      var coordinates = _.map(e.poly.getLatLngs(), function(coords){
        return [coords.lat, coords.lng];
      });
      Features.insert({
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        },
        type: 'Feature',
        trail: Session.get('currentTrail'),
        properties: {}
      });
    },

    // We use  some of Leaflet's helper functions to simplify any set
    // of coordinates we have. We need to project these coordinates
    // into LatLng objects, and then into Points. We simplify the Points,
    // and then convert them back to LatLngs. We then return the
    // array of LatLngs, to be saved in the database.  
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
    }
  });

  return MapView;

})();

