(function(trailmix){

  // When the mapView is rendered, create our map.
  Template.mapView.rendered = function(){

    // Set Map Height
    
    $('#map').height($(window).height() - 80);

     var map = this.map = new L.Map('map', {
        center: new L.LatLng(53.1103, -119.1567),
        zoom: 13,
        layers: new L.TileLayer('http://a.tiles.mapbox.com/v3/bmcmahen.map-75dbjjhk/{z}/{x}/{y}.png')
      });

     // expose our map as a global variable. 
     trailmix.map = map; 

  };

})(Trailmix);


