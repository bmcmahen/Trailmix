(function(){

  // SIDEBAR WRAPPER
  // Slides left or right to reveal detail/browse views.
  Template.sideBar.helpers({
    browsingView : function(){ return Session.equals('mapView', 'browse'); },
    detailView : function(){ return Session.equals('mapView', 'detail'); },
    width: function(){ return Session.get('carouselItemWidth'); },
    position: function(){ return Session.get('carouselPosition'); },
    totalWidth: function(){ return Session.get('carouselTotalWidth'); },
    height: function(){ return Session.get('carouselItemHeight'); }
  });

  Template.sideBar.preserve(['#carousel-inner']);

  // XXX Optimize - This code will run a bazillion times.
  Template.sideBar.rendered = function(){
    this.$el = this.$el || $(this.firstNode).parent();
    var width = this.$el.width();
    Session.set('carouselItemWidth', width);
    Session.set('carouselTotalWidth', width * 2);
    Session.set('carouselItemHeight', this.$el.parent().height());
    this.hasRendered = true;

    if (Session.equals('mapView', 'detail'))
      Session.set('carouselPosition', 0 - width);
    else
      Session.set('carouselPosition', 0);
  };

  // BROWSE TRAILS
  Template.browseView.helpers({
    trail: function(){
      var bounds = MapBounds.findOne();
      if (bounds){
        var sw = bounds.southWest
          , ne = bounds.northEast;

        return Trails.find({
          'coordinates.0': {'$gte' : sw[0], '$lte' : ne[0]},
          'coordinates.1': {'$gte' : sw[1], '$lte' : ne[1]}
        });
      }
    }
  });

  Template.browseTrailList.events({
    'click a' : function(){
      Session.set('mapView', 'detail');
      Session.set('currentTrail', this._id);
    }
  });

  // TRAIL DETAIL
  Template.detailView.events({
    'click .toggle-edit' : function(){
      if (Session.get('isEditing')) {
        Session.set('isEditing', false);
        Session.set('tabView', 'description');
        Session.set('editingFeature', null);
      }
      else Session.set('isEditing', true);
      return false;
    },
    'click .btn-back': function(){
      Session.set('mapView', 'browse');
      return false;
    }
  });

  Template.detailView.helpers({
    isEditing: function(){ return Session.get('isEditing'); },
    trail: function(){ return Trails.findOne(Session.get('currentTrail')); }
  });


  // TRAIL TABS
  Template.trailTabView.helpers({
    isEditing: function(){ return Session.get('isEditing'); },
    featuresTab : function(){ return Session.equals('tabView', 'features'); },
    descriptionTab : function(){ return Session.equals('tabView', 'description'); }
  });

  Template.trailTabView.events({
    // TabView -> Description
    'click .description' : function(){
      Session.set('tabView', 'description');
      Session.set('editingFeature', null);
      return false;
    },
    // TabView -> Features
    'click .features' : function(){
      Session.set('tabView', 'features');
      return false;
    }
  });

  Template.trailTabView.created = function(){
    Session.set('tabView', 'description');
  };

  // DESCRIPTION TAB CONTENT
  Template.descriptionTab.helpers({
    trail : function() {
      var current = Session.get('currentTrail');
      return current && Trails.findOne(current);
    },
    isEditing: function(){ return Session.get('isEditing'); }
  });

  Template.descriptionTab.events({
    // Update trail name & description
    'submit #trail-metadata' : function(e, t) {
      e.preventDefault();
      var name = t.find('.trail-name').value,
          desc = t.find('#trail-description').value;

      Trails.update({_id: this._id}, {'$set' : {
        name: name,
        description: desc
      }});
      Session.set('isEditing', null);
      return false;
    },
    // Set our trail origin
    'click .trailorigin' : function(e, t){
      Session.set('promptInput', 'selectTrailhead');
    }
  });

  // FEATURES TAB
  Template.featuresTab.helpers({
    editingFeature: function(){
      return Features.findOne(Session.get('editingFeature'));
    },
    features: function(){
      var currentTrail = Session.get('currentTrail');
      return currentTrail && Features.find({ trail : currentTrail });
    }
  });

  // Take an array of features & insert them into the DB.
  var createFeatures = function(json){
    _.each(json, function(feature, i){
      _.extend(feature, {trail : Session.get('currentTrail')});
      Features.insert(feature);
    }, this);
  };

  // Take a file, assume it's a GPX and create features
  // out of it.
  var parseGPXFiles = function(files){
    if (!files || !window.FileReader) return;

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
  };

  Template.featuresTab.events({
    'click .upload': function(){
      $('#upload-field').trigger('click');
    },
    'change #upload-field': function(){
      parseGPXFiles(e.currentTarget.files);
    }
  });

  // FEATURE
  Template.feature.events({
    'click .delete' : function(e, t){
      Features.remove(this._id);
      return false;
    },
    'click .edit' : function(e, t){
      Session.set('editingFeature', this._id);
    },
    'click .feature-instance' : function(e, t){
      Session.set('selectedFeature', this._id);
      Trailmix.map.highlightFeature(this._id);
    }
  });

  // EDITING FEATURE TAB CONTENT
  Template.editingFeature.helpers({
    editingFeature: function(){
      return Features.findOne(Session.get('editingFeature'));
    },

    featureTypePoint: function(){
      if (Session.get('featureType'))
        return Session.equals('featureType', 'Point');
      var feature = Features.findOne(Session.get('editingFeature'));
      if (feature.geometry.type === 'Point') return true;
    },

    drawingFeature: function(){
      if (Session.equals('promptInput', 'editFeature') || Session.equals('promptInput', 'drawPolyline')) {
        return true;
      }
    },

    icons: function(){
      return [
        { name: 'campsite' },
        { name: 'circle' },
        { name: 'circle-stroked' },
        { name: 'marker' },
        { name: 'parking' },
        { name: 'square' },
        { name: 'toilets' },
        { name: 'triangle-stroked'}
      ];
    }
  });

  Template.iconList.helpers({
    selectedIcon: function(){
      var currentFeature = Features.findOne(Session.get('selectedFeature'));
      var icon = currentFeature && currentFeature.properties.sym;
      if (icon === this.name) return 'selected';
    }
  });

  Template.iconList.events({
    'click li': function(e, t){
      Features.update({
        _id: Session.get('selectedFeature')
      }, { $set: { 'properties.sym' : this.name }});
    }
  });

  Template.editingFeature.events({
    'submit #feature-form' : function(e, t){
      var name = t.find('.name').value
        , desc = t.find('.description').value;

      Features.update({_id: this._id}, {'$set' : {
        'properties.name' : name,
        'properties.description' : desc
      }});

      Session.set('editingFeature', null);
    },
    'click .back': function(e, t){
      Session.set('editingFeature', null);
      return false;
    },
    'change select' : function(e, t){
      var target = e.currentTarget;
      var val = target.options[target.selectedIndex].value;
      Session.set('featureType', val);
    },
    'click .draw' : function(e, t){
      if (Session.equals('promptInput', 'editFeature') || Session.equals('promptInput', 'drawPolyline')){
        Session.set('promptInput', null);
        return false;
      }
      if (this.geometry.coordinates) {
        Session.set('promptInput', 'editFeature');
      } else {
        Session.set('promptInput', 'drawPolyline');
      }
      return false;
    }
  });

  Template.editingFeature.created = function(){
    Session.set('featureType', null);
  };

})();