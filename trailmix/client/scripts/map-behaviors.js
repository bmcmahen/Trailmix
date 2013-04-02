Trailmix.behaviors = {};

/*
* Behavior Modules
*/

// Observe the features that belong to our currently selected
// trail, and sync them with the map.
Trailmix.behaviors.observeTrailFeatures = function(context) {
	return {
		on : function() {
			var _this = this;

			this.autorun = Meteor.autorun(function() {
				var query = Features.find({ trail: Session.get('currentTrail') });
				if (_this.handle) {
					_this.handle.stop();
					context.removeAllFeatures();
				}
				_this.handle = query.observe({
					added: function(newDoc) {
						console.log('NEWDOC', newDoc);

						if (newDoc.geometry.type && newDoc.geometry.coordinates.length > 0){
							context.addFeature(newDoc);
							context.delayFitBounds();
						}
					},
					changed: function(newDoc, oldDoc) {
						console.log('changed!');
						if (newDoc.geometry.type && newDoc.geometry.coordinates.length > 0){
							console.log('changed, and adding', newDoc);
							context.removeFeature(oldDoc);
							context.addFeature(newDoc);
						}
					},
					removed: function(oldDoc) { context.removeFeature(oldDoc); }
				});
			});
		},
		off : function() {
			if (this.autorun) this.autorun.stop();
			if (this.handle) {
				this.handle.stop();
				context.removeAllFeatures();
			}
		}
	};
};

// Observe our Trails subscription, and update the map with any
// trail that exists within our description.
Trailmix.behaviors.observeTrails = function(context){
	return {
		on : function() {
			var _this = this;
			this.autorun = Meteor.autorun(function() {
				var query = Trails.find();
				if (_this.handle) {
					_this.handle.stop();
					context.removeAllFeatures();
				}
				_this.handle = query.observe({
					added: function(newDoc) { context.addFeature(newDoc); },
					changed: function(newDoc, oldDoc) { console.log('update'); },
					removed: function(oldDoc) { context.removeFeature(oldDoc); }
				});
			});
		},
		off : function() {
			if (this.autorun) this.autorun.stop();
			if (this.handle) {
				this.handle.stop();
				context.removeAllFeatures();
			}
		}
	};
};

// When our map bounds change, we need to update our bounds collection
// so that our subscription information also changes.
Trailmix.behaviors.observeBoundsChanges = function(context){
	return {
		onBoundsChange: function(e) {
			var bounds = context.map.getBounds(),
					boundObject = {
						southWest: [ bounds._southWest.lat, bounds._southWest.lng ],
						northEast: [ bounds._northEast.lat, bounds._northEast.lng ]
					};

			if (MapBounds.find().count() < 1) MapBounds.insert(boundObject);
			else MapBounds.update({}, boundObject);
			context.browseLocation = context.map.getCenter();
			context.browseZoom = context.map.getZoom();
		},
		on : function(){
			context.map.on('moveend', this.onBoundsChange);
		},
		off : function(){
			console.log('off!');
			context.map.off('moveend', this.onBoundsChange);
		}
	};
};

// Determine where the user is currently located, and set the
// map at that location.
Trailmix.behaviors.geoLocate = function(context){
	return {
		onLocationFound: function(e){
			context.map.setView(e.latlng, 12);
			context.map.off('locationfound', this.onLocationFound);
		},
		on : function() {
			context.map.on('locationfound', this.onLocationFound);
			context.map.locate();
		},
		off : function() {
			context.map.off('locationfound', this.onLocationFound);
		}
	};
};

Trailmix.behaviors.selectOrigin = function(context){
	return {
		onClick: function(e){
			Trails.update({_id: Session.get('currentTrail')}, {
				'$set' : { coordinates : [e.latlng.lat, e.latlng.lng] }
			});
			Session.set('promptInput', null);
		},

		on: function(){
			context.map.on('click', this.onClick);
			$(window).on('keyup', function(e){
				if (e.keyCode === 27)
					Session.set('promptInput', null);
			});
		},

		off : function() {
			context.map.off('click', this.onClick);
			$(window).off('keyup');
		}
	};
};

Trailmix.behaviors.displayMessage = function(message, context){
	return {
		$el : $('#map'),
		template: function(message){
			return "<div id='message'><p>"+message+"</p></div>";
		},
		on: function(){
			this.$el.addClass('display-message');
			this.$el.append(this.template(message));
		},
		off: function(){
			this.$el.removeClass('display-message');
			this.$el.find('#message').remove();
		}
	};
};

// XXX Eventually handle clusters, and highlight multiple
// list items in a cluster?
Trailmix.behaviors.highlightFeatureOnHover = function(context){
	return {
		on: function(){
			var _this = this;
			context.markers.on('layeradd', function(e){
				e.layer.on('mouseover', _this.onHover);
				e.layer.on('mouseout', _this.onExit);
			});
			context.markers.on('layerremove', function(e){
				e.layer.off('mouseover', _this.onHover);
				e.layer.off('mouseover', _this.onExit);
			});
		},
		off: function(){
			context.markers.off('layeradd');
		},
		onHover: function(e){
			Session.set('hoveredTrail', e.layer._id);
		},
		onExit: function(e){
			Session.set('hoveredTrail', null);
		}
	};
};

Trailmix.behaviors.drawPolyline = function(context){
	return {
		on: function(){
			this.draw = new L.Draw.Polyline(context.map, {
				title: 'Draw a Line'
			});

			this.draw.on('activated', function(e){
				console.log('drawing controls activated');
			}).enable();

			context.map
				.on('draw:created', function(e){
					// convert our latLngs to arrays

					var coordinates = _.map(e.layer.getLatLngs(), function(coords){
		  	    return [coords.lat, coords.lng];
		  	  });

					Features.update({ _id: Session.get('editingFeature') },
						{'$set': { 'geometry.coordinates' : coordinates }});
					Session.set('promptInput', null);
				})
				.on('draw:edited', function(){
					console.log('draw edited');
				})
				.on('draw:deleted', function(){
					console.log('draw deleted');
				})
				.on('draw:drawstart', function(){
					console.log('draw start');
				})
				.on('draw:drawstop', function(){
					Session.set('promptInput', null);
				});
		},
		off: function(){
			context.map
				.off('draw:created')
				.off('draw:edited')
				.off('draw:deleted');
			this.draw.disable();
			delete this.draw;
		}
	};
};

Trailmix.behaviors.editFeature = function(context){
	return {
		on : function(){
			var feature = this.feature = context.idToFeatures[Session.get('editingFeature')];
			if (feature.type === 'LineString'){
				feature.el.editing.enable();
				feature.el.on('edit',  this.onEdit);
			}
		},
		off : function(){
			this.feature.el.editing.disable();
			this.feature.el.off('edit');
			delete this.feature;
		},
		onEdit: function(e){
			console.log(e);
			if (e._index) {
				console.log('Clicked on:', e._index);
				if (Session.get('sliceMode')){
					// Prompt user to select a first point.
					// Prompt user to select a last point.
					//
					// WITH THIS RANGE, WE CAN PROMPT TO:
					// (1) Choose to delete these coords entirely (delete)
					// (2) Choose to create a new trail from these coords (return)
					// (3) Cancel the selection (escape)
				}
			}
			// Session.set('promptInput', null);
		}
	};
};