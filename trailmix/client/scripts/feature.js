 Trailmix.Feature = (function(){

  // Feature Class
  // 
  // Creates a Leaflet marker or polyline, available as 'el'.
  var Feature = function(doc, options){
    if (!(this instanceof Feature)) 
      return new Feature(doc, options);
    if (doc.geometry) 
      return new EditFeature(doc, options);
    else if (doc.coordinates) 
      return new BrowseFeature(doc, options);
  };

  var EditFeature = function(doc, options){
    this.mapClass = options.map; 
    this.type = doc.geometry.type; 
    this.coords = doc.geometry.coordinates;
    if (doc.properties && doc.properties.sym)
      this.symbol = doc.properties.sym.toLowerCase();
   
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
      return L.marker(this.coords, { icon: this.determineIcon() })
        .bindPopup('<p>Hello world</p>')
        .bindLabel('Im a label!')
        .on('click', _.bind(this.onFeatureClick, this))
        .on('dragend', _.bind(this.onDragEnd, this));
    },

    createPolyline: function(){
      return L.polyline(this.coords, this.defaultLineStyle)
        .on('click', _.bind(this.onFeatureClick, this));
    },

    // Determine which icon our Marker should be using. 
    determineIcon: function(){
      var iconProperties = { iconUrl: '/map_icons/marker-icon.png' };
      switch(this.symbol){
        case 'trail head' :
          _.defaults({ iconSize: [40, 90] }, iconProperties);
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
        this.el.editing.enable();
        this.mapClass.map.fitBounds(feature.getBounds());
      }
    },

    disableEditing: function(){
      if (this.type === 'Point') {
        this.el.dragging.disable();
      } else if (this.type === 'LineString') {
        this.el.editing.disable();
      }
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
    this.coords = doc.coordinates;
  };

  _.extend(BrowseFeature.prototype, {
    // Special Browse Feature Functions go here.
  });

  return Feature;

})();
