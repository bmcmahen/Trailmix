Trailmix.MapView = (function(){

  // Meteor Observer -> Leaflet View
  var MapView = function(){
    this.map = new L.Map('map', {
      center: new L.LatLng(53.1103, -119.1567),
      zoom: 10,
      layers: new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
      // layers: new L.TileLayer('http://a.tiles.mapbox.com/v3/bmcmahen.map-75dbjjhk/{z}/{x}/{y}.png'),
      maxZoom: 15,
      attributionControl: false
    });
    L.control.scale().addTo(this.map);
    this.features = L.featureGroup().addTo(this.map);
    this.markers = new L.MarkerClusterGroup().addTo(this.map);
    this.idToFeatures = {};
    this.modes = {
      detail : new Trailmix.modes.Detail(this),
      browse : new Trailmix.modes.Browse(this),
      selectTrailhead: new Trailmix.modes.SelectTrailhead(this)
    };
    this.determineMapMode().promptInput();

  };

  _.extend(MapView.prototype, {

    // Install/bind our behaviors
    install: function(behavior){
      behavior.on();
    },

    // Remove/bind our behaviors
    uninstall: function(behavior) {
      behavior.off();
    },

    // Responds to Session.get('mapView') and either enters
    // detailMode or browseMode.
    determineMapMode: function(){
      var _this = this;
      if (this.determineMode) this.determineMode.stop();
      this.determineMode = Meteor.autorun(function(){
       var view = Session.get('mapView');
       var mode = _this.modes[view];
       if (_this.mode) _this.mode.exit();
       mode.enter();
       _this.mode = mode;
      });
      return this;
    },

    promptInput: function(){
      var _this = this;
      if (this.promptUserInput) this.promptUserInput.stop();

      this.promptUserInput = Meteor.autorun(function(){
        var input = Session.get('promptInput');

        if (!input && _this.prompt) {
          _this.prompt.exit();
          delete _this.prompt;
        } else if (input) {
          if (_this.prompt) _this.prompt.exit();
          var mode = _this.modes[input];
          mode.enter();
          _this.prompt = mode;
        }

      });
      return this;
    },

    // Handle Observe -> Map data synchronization.
    addFeature: function(doc){
      var newFeature = Trailmix.Feature(doc, { map : this });
      if (!newFeature) return;
      var el = newFeature.el;
      this.idToFeatures[doc._id] = newFeature;
      if (Session.equals('mapView', 'browse')) {
        this.markers.addLayer(el);
        return this;
      }
      this.features.addLayer(el);
      if (el._label && el._label.options.noHide)
        el.showLabel();
      return this;
    },

    // Remove Feature & Remove Trail are basically the same, except
    // for 'features' contains a different kind of object. I should
    // eventually make this perform the same, which would allow
    // better code reuse.
    removeFeature: function(doc){
      var feature = this.idToFeatures[doc._id];
      if (feature) {
        if (Session.equals('mapView', 'browse')) {
          this.markers.addLayer(el);
        } else {
          this.features.removeLayer(feature.el);
        }
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
        this.markers.clearLayers();
        this.idToFeatures = {};
      }
    },

    // Basic map functions
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
      if (this.timer) Meteor.clearInterval(this.timer);
      this.timer = Meteor.setTimeout(_.bind(this.fitBounds, this), 100);
    },

    resizeMap: function(){
      this.map.invalidateSize(true);
      return this;
    },

    // XXX also allow adding a marker
    addDrawingControls: function(){
      // Enable Polyline Drawing
      this.draw = new L.Polyline.Draw(this.map, { title: 'Draw a line.' });
      this.map
        .on('draw:poly-created', _.bind(this.onFeatureCreated, this))
        .on('drawing', function(){
          console.log('drawing is happening');
        });

      this.draw
        .on('activated', function(e){
          console.log('drawing controls activated');
        })
        .enable();
    },

    highlightFeature: function(id){
      var highlighted = this.currentlyHightlighted;
      if (highlighted) highlighted.disableHighlight();
      this.currentlyHightlighted = this.idToFeatures[id].highlight();
    },

    // Editing States
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

