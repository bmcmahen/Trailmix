(function(Trailmix){

  Template.mapView.rendered = function(){
    Trailmix.map = new Trailmix.MapView();
  };

  Template.mapView.destroyed = function(){
    this.handle && this.handle.stop(); 
  };

})(Trailmix);


