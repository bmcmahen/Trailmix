(function(Trailmix){

  // Our Sidebar should change views if we are in browse
  // mode, or detail mode.
  Template.sideBar.helpers({
    browsingView : function() {
      return Session.equals('mapView', 'browse');
    },
    detailView : function(){
      return Session.equals('mapView', 'detail');
    },
    width: function(){
      return Session.get('carouselItemWidth');
    },
    position: function(){
      return Session.get('carouselPosition');
    },
    totalWidth: function(){
      return Session.get('carouselTotalWidth');
    },
    height: function(){
      return Session.get('carouselItemHeight');
    }
  });

  Template.sideBar.preserve(['#carousel-inner']);

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

  // Enter editing mode.
  Template.detailView.events({
    'click .edit-trail' : function(){
      Session.set('isEditing', true);
    }
  });

  Template.detailView.helpers({
    isEditing: function(){
      return Session.get('isEditing');
    },
    trail: function(){
      return Trails.findOne(Session.get('currentTrail'));
    }
  });

  Template.browseView.helpers({
    trail: function(){
      // XXX Sort by rating?
      // XXX Handle limits?
      // XXX Optimize to also get those in the surrounding area? (or do
      // this on the subscription?)
      // XXX eventually use $where && $box if minimongo ever supports the
      // geo stuff.
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



})(Trailmix);