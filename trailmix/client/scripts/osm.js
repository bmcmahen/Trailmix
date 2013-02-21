(function(window){

  Meteor.http.get('http://api.openstreetmap.org/api/0.6/gpx', function(err, data){
    window.data = data;
    console.log(data);
  });

  // You can download trace metadata using:
  // GET /api/0.6/gpx/<id>/details
  // GET /api/0.6/gpx/<id>/data
  // 
  // http://www.openstreetmap.org/traces/tag/National%20Park
})(window);