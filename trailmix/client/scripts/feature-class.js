 Trailmix.Feature = (function(){

  // Feature API
  // Either creates a 'BrowseFeature' or 'DetailFeature' depending
  // on our document type. 
  var Feature = function(doc, options){
    if (doc.geometry) return new EditFeature(doc, options);    
    else if (doc.coordinates) return new BrowseFeature(doc, options);
  };

  var EditFeature = function(doc, options){
    this.mapClass = options.map; 
    this.type = doc.geometry.type; 
    this.coords = doc.geometry.coordinates;
    if (doc.properties){
      this.markerSymbol = doc.properties.markerSymbol;
      this.markerSize = doc.properties.markerSize;
      this.name = doc.properties.name;
    }
   
    // Default Styles
    this.defaultLineStyle = {
      color: 'rgb(33, 47, 151)',
      opacity: 1,
      weight: 2.5,
      dashArray: '8, 5'
    }

    // Build our feature, depending on if it's a point
    // or linestring.
    this.el = (function(){
      if (this.type === 'Point')
        return this.createMarker(); 
      if (this.type === 'LineString')
        return this.createPolyline();
    }).call(this);
    this.el._id = doc._id;
  };

  // Feature Class Functions
  _.extend(EditFeature.prototype, {

    // Create our Marker
    createMarker: function(){
      return L.marker(this.coords, { 
          icon: this.determineIcon(),
          riseOnHover: true
        })
        .bindLabel(this.name, { noHide: true })
        .on('click', _.bind(this.onFeatureClick, this))
        .on('dragend', _.bind(this.onDragEnd, this));
    },

    createPolyline: function(){
      return L.polyline(this.coords, this.defaultLineStyle)
        .on('click', _.bind(this.onFeatureClick, this))
        .on('dragend', _.bind(this.onDragEnd, this));
    },

    // Determine which icon our Marker should be using. 
    determineIcon: function(){
      var iconProperties = { 
        iconUrl: '/images/icons/circle-12.png',
        iconSize: [12, 12],
        labelAnchor: [4, 8]
      };

      switch(this.markerSymbol){
        case 'trail head' :
          _.defaults({ iconSize: [18, 18] }, iconProperties);
          break;
      }
      return L.icon(iconProperties);
    },

    // EDITING
    // 
    enableEditing: function(){
      if (this.type === 'Point') {
        this.el.dragging.enable();
      } else if (this.type === 'LineString') {
        this.mapClass.map.fitBounds(this.el.getBounds());
        this.el.editing.enable();
        this.el.on('edit', function(e){
          //this returns the entire polyline that has been
          //edited, which is fine for 'updates'. For certain
          //forms of editing, we need to figure out which points
          //are being clicked, to determine where to split certain
          //lines. 
          console.log('hi', e)
        });
      }
    },

    disableEditing: function(){
      if (this.type === 'Point') {
        this.el.dragging.disable();
      } else if (this.type === 'LineString') {
        this.el.editing.disable();
        this.el.off('edit');
      }
    },

    // Take two points, and remove every point in between.
    slicePolyline: function(){
    },

    // Take one point, and create two Polylines out of them.
    splitPolyline: function(){

    },

    // Take two polylines (id) and join them. NOTE. This might
    // be difficult and kinda useless. Polyline cannot overlap. 
    joinPolyline: function(){

    },

    // HIGHLIGHTING
    // 
    highlight: function(){
      if (this.type === 'LineString'){
        this.mapClass.map.fitBounds(this.el.getBounds());
        this.el.setStyle({
          color: 'red',
          weight: 3,
          dashArray: null
        });
      } else if (this.type === 'Point'){
        this.el.openPopup(); 
        this.mapClass.map.panTo(this.el.getLatLng());
      }
      return this; 
    },

    disableHighlight: function(){
      if (this.type === 'Point') {
        this.el.closePopup();
      } else if (this.type === 'LineString'){
        this.el.setStyle(this.defaultLineStyle);
      }
      return this; 
    },

    // EVENTS
    // Feature has been clicked.
    onFeatureClick: function(e){
      var id = e.target._id; 
      Session.set('selectedFeature', id);
      this.focusListElement(id);
    },

    // Marker has been dragged and dropped. 
    onDragEnd: function(e){
      var feature = e.target
        , latLng = feature.getLatLng();
      console.log('onDragEnd');
    },

    focusListElement: function(id){
      if (Session.equals('tabView', 'features') && Session.get('isEditing')) {
        var $container = $('#edit-tabs-content')
          , $target = $('#' + id);

        $container.animate({
          scrollTop: $target.offset().top - $container.offset().top + $container.scrollTop()
        }, 500);
      }
    }
  });

  var BrowseFeature = function(doc, options){
    this.mapClass = options.map; 
    this.doc = doc;
    this.el = new L.Marker(doc.coordinates);
    this.el.on('click', _.bind(this.onClick, this));
  };

  _.extend(BrowseFeature.prototype, {
    onClick: function(e){
      Session.set('currentTrail', this.doc._id);
      Session.set('mapView', 'detail');
      // A trail should _always_ have one feature by necessity,
      // which should be the origin point of the trail. This cannot
      // be deleted, but only changed. This ensures that 'fitBounds'
      // will always be called, no matter the map. 
    }
  });

  return Feature;

})();
