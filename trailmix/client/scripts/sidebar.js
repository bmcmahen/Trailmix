(function(Trailmix){


  Template.sideBar.helpers({
    isEditing : function() {
      return Session.get('isEditing');
    }
  });

  Template.sideBar.events({
    'click .edit-trail' : function(){
      Session.set('isEditing', true);
    }
  });


  


})(Trailmix);