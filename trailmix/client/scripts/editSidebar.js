// (function(){

//   var global = this;

//   // Take an array of features, and insert them into the database
//   // with the currentTrail _id as the trail attribute. This should
//   // update our trail automatically.
//   var createFeatures = function(json){
//     _.each(json, function(feature, i){
//       _.extend(feature, {trail : Session.get('currentTrail')});
//       Features.insert(feature);
//     }, this);
//   };


//   // EDIT SIDEBAR TEMPLATE
//   Template.editSidebar.helpers({

//     trail : function() {
//       var current = Session.get('currentTrail');
//       return current && Trails.findOne(current);
//     },

//     features : function() {
//       var currentTrail = Session.get('currentTrail');
//       return currentTrail && Features.find({ trail : currentTrail });
//     },

//     featuresTab : function() {
//       return Session.equals('tabView', 'features');
//     },

//     descriptionTab : function() {
//       return Session.equals('tabView', 'description');
//     },

//     addFeaturesTab : function() {
//       return Session.equals('tabView', 'addFeatures');
//     },

//     editingFeature: function(){
//       return Features.findOne(Session.get('editingFeature'));
//     }

//   });

//   Template.editSidebar.created = function() {
//     Session.set('tabView', 'description');
//   };

//   Template.editSidebar.rendered = function() {
//     // Meteor doesn't handle universal events very well,
//     // so we handle them here.
//     $(window).on('dragover', function(e){
//       e.preventDefault();
//       $('#features').addClass('dragover');
//     });

//     $(window).on('dragleave', function(e){
//       $('#features').removeClass('dragover');
//     });

//     $(window).on('drop', function(e){
//       e.preventDefault();
//     });
//   };

//   var parseGPXFiles = function(files){
//     if (!files || !window.FileReader) return;

//     // XXX Make sure our browser supports the FIleReader
//     // ... i.e., not IE < 10 (hah)
//     var reader = new FileReader();
//     reader.onload = function(e){
//       var util = Trailmix.Utils;
//       util.GPXtoGeoJSON(e.target.result, function(json){
//         createFeatures(json);
//       });
//     };

//     reader.readAsText(files[0]);
//   };

//   Template.editSidebar.events({

//     'dragover #features' : function(e, t) {
//       e.preventDefault();
//       $(e.currentTarget).addClass('dragover');
//     },

//     'click .upload': function(e, t){
//       $('#upload-field').trigger('click');
//     },

//     'change #upload-field': function(e, t){
//       parseGPXFiles(e.currentTarget.files);
//     },

//     'dragleave #features' : function(e, t) {
//       $(e.currentTarget).removeClass('dragover');
//     },

//     // Converts a GPX file and inserts it into the currently
//     // selected trail.
//     'drop #features' : function(e, t) {
//       e.preventDefault();
//       $(e.currentTarget).removeClass('dragover');

//       var files = e.dataTransfer.files;
//       parseGPXFiles(files);
//     },

//     // Update trail name & description
//     'submit #trail-metadata' : function(e, t) {

//       e.preventDefault();

//       var name = t.find('.trail-name').value,
//           desc = t.find('#trail-description').value;

//       Trails.update({_id: this._id}, {'$set' : {
//         name: name,
//         description: desc
//       }});

//       return false;
//     },

//     'submit #feature-form' : function(e, t){
//       var name = t.find('.name').value
//         , desc = t.find('.description').value;

//       Features.update({_id: this._id}, {'$set' : {
//         'properties.name' : name,
//         'properties.description' : desc
//       }});

//       Session.set('editingFeature', null);
//     },

//     // TabView -> Description
//     'click .description' : function(){
//       Session.set('tabView', 'description');
//       return false;
//     },

//     // TabView -> Features
//     'click .features' : function(){
//       Session.set('tabView', 'features');
//       return false;
//     },

//     'click .add-features' : function(){
//       Session.set('tabView', 'addFeatures');
//       return false;
//     },

//     'click #add-line' : function(){
//       Trailmix.map.addDrawingControls();
//       return false;
//     },

//     'click #add-point' : function(){
//       console.log('add point');
//       return false;
//     },

//     // Trigger autocomplete
//     'input textarea' : function(e){


//       this.endTagging = function(){
//         delete this.start;
//         delete this.end;
//         this.tagging = false;
//         console.log('end tagging');
//         Session.set('taggingQuery', null);
//       };

//       // Behaviour is different when
//       // (1) we are starting at the beginning of the textarea. Our index
//       // is one ahead.
//       // (2) we place n @ after the fact, directly before a letter.
//       // Build for the typical user interaction:
//       // - space + @

//       if (this.tagging){

//         var currentPos = this.textarea.selectionStart;

//         if ((currentPos - this.start) < 0){
//           this.endTagging();
//           return;
//         }

//         if (typeof this.start === 'undefined')
//           this.start = currentPos;

//         if (this.start === 0)
//           this.textarea.selectionStart = 1;
//         else if (this.textarea.value.charAt(this.start) === '@') {
//           this.start += 1;
//         }

//         // if we've started inputting text before the @ or after our
//         // end point (by more than one space) then we assume that
//         // tagging has finished.
//         if (currentPos > this.end + 1 || currentPos < this.start) {
//           this.endTagging();
//           return;
//         }

//         // if we don't have an end position, or our currentPos is greater
//         // than our endPos, we set our endPos to our currentPos
//         if (!this.end || currentPos > this.end) {
//           this.end = this.textarea.selectionStart + 1;
//         }

//         // If we are selecting/deleting part of our tag, update our
//         // end position accordingly.
//         if (this.selectionLength > 0){
//           if (this.key === 8 || this.key === 46) {
//             if (this.end - selectionLength === 0) this.endTagging();
//             this.end -= selectionLength;
//           }
//           else {
//             if ((this.end - (selectionLength - 1)) <= 1) this.endTagging();
//             this.end -= selectionLength - 1;
//           }
//         }
//         // otherwise, if our currentPosition is less than our endPos and we are
//         // entering text, then we need to increment our endPos
//         else if (currentPos < this.end && currentPos > this.start) {
//           // unless we are deleting, and then we need to decrement our endPos
//           if (this.key === 8 || this.key === 46) this.end -= 1;
//           else if (currentPos + 1 < this.end){
//             console.log(currentPos, this.end);
//             this.end += 1;
//           }
//         }

//         var query = this.textarea.value.substring(this.start, this.end + 1);
//         console.log(query);
//         Session.set('taggingQuery', this.query);
//       }

//     },

//     'keydown textarea' : function(e){
//       this.key = e.which;
//       this.selectionLength = null;
//       // If tagging, record our selection length
//       if (!this.textarea)
//         this.textarea = document.getElementById('trail-description');

//       if (this.tagging){
//         this.selectionLength = this.textarea.selectionEnd - this.textarea.selectionStart;
//       }

//       // @symbol
//       if (e.shiftKey && e.which === 50){
//         if (this.tagging) this.endTagging();
//         this.tagging = true;
//       }


//     },

//     'click .back' : function(){
//       Session.set('editingFeature', null);
//     },


//     'click .trailorigin' : function(e, t){
//       console.log('hi??');
//       Session.set('promptInput', 'selectTrailhead');
//     },

//     'click .btn-back': function(e, t){
//       Session.set('mapView', 'browse');
//       return false;
//     }

//   });

//   Template.editSidebar.destroyed = function(){
//     $(window).off('dragover, dragleave, drop');
//   };

//   // FEATURE TEMPLATE
//   Template.feature.events({

//     // remove a feature
//     'click .delete' : function(e, t) {
//       Features.remove(this._id);
//     },

//     // edit the selected feature in the map
//     'click .edit' : function(e, t) {
//       Session.set('editingFeature', this._id);
//       Trailmix.map.editFeature(this);
//     },

//     // enter editing mode
//     'click .edit-trail' : function(e, t) {
//       Session.set('isEditing', true);
//     },

//     'click .feature-instance' : function(e, t){
//       Session.set('selectedFeature', this._id);
//       Trailmix.map.highlightFeature(this._id);
//     }

//   });

//   Template.feature.helpers({

//     // highlight the currently selected feature
//     selected: function(){
//       return Session.equals('selectedFeature', this._id);
//     }

//   });

//   Template.feature.preserve({
//     'img[id]': function(node) { return node.id; }
//   });


// }).call(this);