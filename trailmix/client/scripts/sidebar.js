(function(Trailmix){


  // Take an array of features, and insert them into the database
  // with the currentTrail _id as the trail attribute. This should
  // update our trail automatically. 
  var createFeatures = function(json){
    _.each(json, function(feature, i){
      _.extend(feature, {trail : Session.get('currentTrail')});
      Features.insert(feature);
    }, this);
  }


  Template.sideBar.rendered = function(){

    // Meteor doesn't handle universal events very well,
    // so we handle them here. 
    $(window).on('dragover', function(e){
      e.preventDefault(); 
      $('#features').addClass('dragover');
    });

    $(window).on('dragleave', function(e){
      $('#features').removeClass('dragover');
    });

    $(window).on('drop', function(e){
      e.preventDefault();
    });

  };

  Template.sideBar.destroyed = function(){

    // Unbind our window events
    $(window).off('dragover, dragleave, drop');

  }

  Template.sideBar.events({

    'dragover #features' : function(e, t) {
      e.preventDefault(); 
      $(e.currentTarget).addClass('dragover');
    },

    'dragleave #features' : function(e, t) {
      $(e.currentTarget).removeClass('dragover');
    },

    // Converts a GPX object 
    'drop #features' : function(e, t) {
      e.preventDefault();
      $(e.currentTarget).removeClass('dragover');
      
      var files = e.dataTransfer.files;

      if (!files || !window.FileReader)
        return 

      // XXX Make sure our browser supports the FIleReader
      // ... i.e., not IE < 10 (hah)
      var reader = new FileReader();
      reader.onload = function(e){
        var util = Trailmix.Utils;
        util.GPXtoGeoJSON(e.target.result, function(json){
          createFeatures(json);
        });
      };

      reader.readAsText(files[0]);

    },

    // remove a feature
    'click .delete-feature' : function(e, t) {
      Features.remove(this._id);
    },

    // enter editing mode
    'click .edit-trail' : function(e, t) {
      Session.set('isEditing', true);
    },

    // exit editing mode
    'click .finish-editing' : function(e, t) {
      Session.set('isEditing', false);
    },

    // Update the trail name and description. 
    'submit #trail-info' : function(e, t) {

      e.preventDefault(); 

      var name = t.find('.name').value
        , desc = t.find('.description').value; 

      Trails.update({_id: this._id}, {'$set' : { 
        name: name,
        description: desc
      }}); 

      return false;
    }

  });


  Template.sideBar.helpers({

    // our selected trail's features
    features: function() {
      if (Session.get('currentTrail'))
        return Features.find({trail: Session.get('currentTrail')});
    },

    // our selected trail
    trail : function(){
      var current = Session.get('currentTrail');
      return current && Trails.findOne(current);
    },

    // whether we are in edit mode or not
    isEditing : function() {
      return Session.get('isEditing');
    }
  });

})(Trailmix);