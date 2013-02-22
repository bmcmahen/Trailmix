(function(){

  var Global = this; 

  // Take an array of features, and insert them into the database
  // with the currentTrail _id as the trail attribute. This should
  // update our trail automatically. 
  var createFeatures = function(json){
    _.each(json, function(feature, i){
      _.extend(feature, {trail : Session.get('currentTrail')});
      Features.insert(feature);
    }, this);
  };

  // EDIT SIDEBAR TEMPLATE
  Template.editSidebar.helpers({

    trail : function() {
      var current = Session.get('currentTrail');
      return current && Trails.findOne(current);
    },

    features : function() {
      var currentTrail = Session.get('currentTrail');
      return currentTrail && Features.find({ trail : currentTrail });
    },

    featuresTab : function() {
      return Session.equals('tabView', 'features');
    },

    descriptionTab : function() {
      return Session.equals('tabView', 'description');
    }

  });

  Template.editSidebar.created = function() {
    Session.set('tabView', 'description');
  };

  Template.editSidebar.rendered = function() {
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


  Template.editSidebar.events({

    'dragover #features' : function(e, t) {
      e.preventDefault(); 
      $(e.currentTarget).addClass('dragover');
    },

    'dragleave #features' : function(e, t) {
      $(e.currentTarget).removeClass('dragover');
    },

    // Converts a GPX file and inserts it into the currently
    // selected trail. 
    'drop #features' : function(e, t) {
      e.preventDefault();
      $(e.currentTarget).removeClass('dragover');
      
      var files = e.dataTransfer.files;

      if (!files || !window.FileReader)
        return;

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

    // Update trail name & description
    'submit #trail-info' : function(e, t) {

      e.preventDefault(); 

      var name = t.find('.name').value
        , desc = t.find('.description').value; 

      Trails.update({_id: this._id}, {'$set' : { 
        name: name,
        description: desc
      }}); 

      return false;
    },

    // TabView -> Description
    'click .description' : function(){
      Session.set('tabView', 'description');
      return false;
    },

    // TabView -> Features
    'click .features' : function(){
      Session.set('tabView', 'features');
      return false; 
    },

    'click #add-line' : function(){
      Trailmix.map.addDrawingControls(); 
    },

    'click #add-point' : function(){
      console.log('add point');
    }

  });

  Template.editSidebar.destroyed = function(){
    $(window).off('dragover, dragleave, drop');
  };


  // FEATURE TEMPLATE 
  Template.feature.events({

    // remove a feature
    'click .delete-feature' : function(e, t) {
      Features.remove(this._id);
    },

    // edit the selected feature in the map
    'click .edit-feature' : function(e, t) {
      Trailmix.map.editFeature(this);
    },

    // enter editing mode
    'click .edit-trail' : function(e, t) {
      Session.set('isEditing', true);
    },

    'click .feature-instance' : function(e, t){
      Session.set('selectedFeature', this._id);
      Trailmix.map.highlightFeature(this._id);
    }

  });

  Template.feature.helpers({

    // highlight the currently selected feature
    selected: function(){
      return Session.equals('selectedFeature', this._id);
    }

  }); 


}).call(this);