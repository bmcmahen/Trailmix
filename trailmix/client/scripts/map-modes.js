(function(){

	Trailmix.modes = {};

	// Shared mode functions
	var modeFunctions = {
		enter: function(){
			_.each(this.behaviors, function(behavior){
				this.context.install(behavior);
			}, this);
		},
		exit: function(){
			_.each(this.behaviors, function(behavior){
				this.context.uninstall(behavior);
			}, this);
		}
	};

	Trailmix.modes.Detail = function(context){
		var mode = {
			context : context,
			behaviors: [
				Trailmix.behaviors.observeTrailFeatures(context)
			]
		};
		_.extend(mode, modeFunctions);
		return mode;
	};

	Trailmix.modes.Browse = function(context){
		var mode = {
			context : context,
			behaviors: [
				Trailmix.behaviors.observeTrails(context),
				Trailmix.behaviors.observeBoundsChanges(context)
			]
		};

		mode.enter = function(){
			_.each(this.behaviors, function(behavior){
				context.install(behavior);
			});

			if (context.browseLocation) {
				context.map.setView(context.browseLocation, context.browseZoom);
			} else {
				context.install(Trailmix.behaviors.geoLocate(context));
			}
		};

		mode.exit = modeFunctions.exit;
		return mode;
	};

	Trailmix.modes.SelectTrailhead = function(context){
		var message = 'Click to Select the Primary Trailhead';
		var mode = {
			context: context,
			behaviors: [
				Trailmix.behaviors.selectOrigin(context),
				Trailmix.behaviors.displayMessage(message, context)
			]
		};
		_.extend(mode, modeFunctions);
		return mode;
	};

	Trailmix.modes.DrawPolyline = function(context){
		var message = 'Draw a line.';
		var mode = {
			context: context,
			behaviors: [
				Trailmix.behaviors.displayMessage(message, context),
				Trailmix.behaviors.drawPolyline(context)
			]
		};
		_.extend(mode, modeFunctions);
		return mode;
	};

	Trailmix.modes.EditFeature = function(context){
		var message = 'Edit the line.';
		var mode = {
			context: context,
			behaviors: [
				Trailmix.behaviors.displayMessage(message, context),
				Trailmix.behaviors.editFeature(context)
			]
		};
		_.extend(mode, modeFunctions);
		return mode;
	};

})();
