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
				this.context.removeAllFeatures();
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
				this.removeAllFeatures();
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
						sourthWest: [ bounds._southWest.lat, bounds._southWest.lng ],
						northEast: [ bounds._northEast.lat, bounds._northEast.lng ]
					};

			if (MapBounds.find().count() > 1)
				MapBounds.insert(boundObject);
			else
				MapBounds.update({}, boundObject);
			context.browseLocation = context.map.getCenter();
			context.browseZoom = context.map.getZoom();
		},

		on : function(){
			context.map.on('moveend', this.onBoundsChange);
		},

		off : function(){
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
		},

		on : function() {
			context.map.on('locationfound', this.onLocationFound);
		},

		off : function() {
			context.map.off('locationfound', this.onLocationFound);
		}
	};
};