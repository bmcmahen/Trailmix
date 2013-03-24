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
    this.idToFeatures = {};
    this.modes = {
      detail : new Trailmix.modes.Detail(this),
      browse : new Trailmix.modes.Browse(this)
    };
    this.determineMapMode();
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
        if (Session.equals('mapView', 'detail'))
          _this.enterMode('detail');
        else if (Session.equals('mapView', 'browse'))
          _this.enterMode('browse');
      });
    },

    // TODO: Modes aren't necessarily mutually exclusive.
    // If we are editing, for instance, we will be in 'detail' mode.
    // If we are switching between detail, and browse, then we
    // should reset our modes. This means we should probably
    // keep an array of modes, and iterate through each, exiting
    // each mode if need be.
    // Otherwise we could:
    // (1) Session.set('mapView', 'detail');
    // (2) Session.set('mapView', 'origin');
    // How do we _exit_ modes, then?
    enterMode: function(name){
      if (this.mode && name !== 'drawing') this.mode.exit();
      console.log(this);
      this.modes[name].enter();
      this.mode = this.modes[name];
    },


    // Handle Observe -> Map data synchronization.
    addFeature: function(doc){
      var newFeature = Trailmix.Feature(doc, { map : this }),
          el;

      if (!newFeature) return;
      el = newFeature.el;
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
      this.timer = Meteor.setTimeout(_.bind(this.fitBounds, this), 300);
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

