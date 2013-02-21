Trailmix.TrailMap = (function(){

  var TrailMap = function(){
    this.map = map || new L.Map('map', {
      center: new L.LatLng(53.1103, -119.1567),
      zoom: 10,
      layers: new L.TileLayer('http://a.tiles.mapbox.com/v3/bmcmahen.map-75dbjjhk/{z}/{x}/{y}.png'),
      maxZoom: 15
    });
    this.features = L.featureGroup().addTo(this.map);
    this.idToFeatures = {}; 
    this.map.locate({ setView : true });
  };

  return TrailMap;
})();