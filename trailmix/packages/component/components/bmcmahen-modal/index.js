/**
 * Modal Module
 *
 * Super simple modal dialogues. 
 * 
 */

var Emitter = require('emitter');

module.exports = function(selector, options){
	if (typeof selector === 'string') {
		return new Modal(document.querySelector(selector), options);
	}
}

// Constructor
var Modal = function (element, options) {
	this.options = options || {}; 
	this.element = element;
	this.isShown = false; 
}


Modal.prototype = new Emitter();


// Functions

Modal.prototype.toggle = function(){
	this.isShown ? this.hide() : this.show(); 
};

Modal.prototype.show = function(){
	var self = this
		, el = self.element; 

	if (this.isShown)
		return

	self.isShown = true; 
	self.emit('show');

	el.className += ' in';
	el.setAttribute('aria-hidden', false);
	el.focus(); // for aria-support, must have tabindex='-1' set.

	return this; 
};

Modal.prototype.hide = function(){
	var self = this
		, el = self.element; 

	if (!this.isShown)
		return

	self.isShown = false; 
	self.emit('hide');

	self.remove(); 
};

Modal.prototype.remove = function(){
	var el = this.element; 
	el.className = el.className.replace( /(?:^|\s)in(?!\S)/g , '' )
	el.setAttribute('aria-hidden', true);
};
