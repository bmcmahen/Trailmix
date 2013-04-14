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
    this.addFeatureGroup();
    this.markers = new L.MarkerClusterGroup().addTo(this.map);
    this.idToFeatures = {};
    this.modes = {
      detail : new Trailmix.modes.Detail(this),
      browse : new Trailmix.modes.Browse(this),
      selectTrailhead: new Trailmix.modes.SelectTrailhead(this),
      drawPolyline: new Trailmix.modes.DrawPolyline(this),
      editFeature: new Trailmix.modes.EditFeature(this)
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

    addFeatureGroup: function(){
      this.features = L.featureGroup();
    },

    // Responds to Session.get('mapView') and either enters
    // detailMode or browseMode.
    determineMapMode: function(){
      var _this = this;
      if (this.determineMode) this.determineMode.stop();
      this.determineMode = Deps.autorun(function(){
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

      this.promptUserInput = Deps.autorun(function(){
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
          this.markers.removeLayer(feature.el);
        } else {
          console.log('feature', feature);
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
        var bnds = this.features.getBounds();
        this.map.fitBounds(this.features.getBounds());
        var self = this;
        Meteor.setTimeout(function(){
          self.features.addTo(self.map);
        }, 400);
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

    highlightFeature: function(id){
      var highlighted = this.currentlyHightlighted;
      if (highlighted) highlighted.disableHighlight();
      var feature = this.idToFeatures[id];
      if (feature) {
        this.currentlyHightlighted = feature.highlight();
      }
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

