(function(Trailmix){


  Template.sideBar.helpers({
   
    browsingView : function() {
      return Session.equals('mapView', 'browse');
    },

    detailView : function(){
      return Session.equals('mapView', 'detail');
    }

  });

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


  


})(Trailmix);