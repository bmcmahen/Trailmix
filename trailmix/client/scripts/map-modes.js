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

		if (!context.browseLocation)
			mode.behaviors.push(Trailmix.behaviors.geoLocate(context));

		mode.enter = function(){
			_.each(this.behaviors, function(behavior){
				context.install(behavior);
			});
			if (context.browseLocation)
				context.map.setView(context.browseLocation, context.browseZoom);
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



})();
