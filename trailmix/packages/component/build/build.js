
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

require = function(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = callbacks.indexOf(fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("bmcmahen-modal/index.js", function(exports, require, module){
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

});
require.register("bmcmahen-dropdown/index.js", function(exports, require, module){
/**
 *
 * Super simple vanilla JS dropdown menu
 * inspired by Bootstrap, uikit.
 *
 */

// XXX need way of closing other opened menus when
// clicking new menu.


// API (not much of one, yet...)
// return the dropdown menu object, and automatically setup event handler
module.exports = function(selector){
	return new Dropdown(document.querySelector(selector))._toggleClick();
}

// Keep track of opened dropdown so that we can close it
// if another dropdown trigger is clicked.
var openDropdown = null;

// Constructor
var Dropdown = function(element){
	this.element = element;
	this.parent = element.parentNode;
	this.list = this.parent.querySelector('.dropdown-menu');
	this.isShown = false;
}

// Functions
Dropdown.prototype = {

	// Either show or hide, depending on currentState
	toggle: function(){
		this.isShown ? this.hide() : this.show();
	},

	// Hide the element, and remove window event listener
	hide: function(){
		var self = this
			, parent = self.parent
			, list = self.list;

		if (!this.isShown)
			return

		openDropdown = null;
		self._removeEvents();

		self.isShown = false;
		parent.className = parent.className.replace( /(?:^|\s)open(?!\S)/g , '' )
		list.setAttribute('aria-hidden', true);

		return this;
	},

	// Show element, and add window event listener
	show: function(){
		var self = this
			, parent = self.parent
			, list = self.list;

		if (openDropdown)
			openDropdown.hide();

		openDropdown = self;
		self._addEvents();

		if (self.isShown)
			return

		self.isShown = true;

		parent.className += ' open';
		list.setAttribute('aria-hidden', false);
		var toFocus = list.querySelector('[tabindex = "-1"]');
		if (toFocus)
			toFocus.focus();

		return this;
	},

	// Primary event handler for clicking trigger element
	_toggleClick: function(){
		var self = this
			, el = self.element;

		el.onclick = function(e){
			self.toggle();
			e.stopPropagation();
			e.preventDefault();
			return false;
		}

		return this;
	},

	// Add event handler for clicking on the window, to close dropdown.
	_addEvents: function(){
		var self = this;
		self.htmlEvent = document.querySelector('html');
		self.htmlEvent.onclick = function(){
			self.hide();
		};

		window.onkeyup = function(e){
			if (e.which === 27) { //esc
				self.hide();
				self.element.focus();
			}
		};

	},

	// Remove the window event handler, so it doesnt keep firing
	// when the dropdown isnt shown. XXX potential conflict here?
	_removeEvents: function(){
		this.htmlEvent.onclick = null;
		window.onkeyup = null;
	}
}
});
require.alias("bmcmahen-modal/index.js", "undefined/deps/modal/index.js");
require.alias("component-emitter/index.js", "bmcmahen-modal/deps/emitter/index.js");

require.alias("bmcmahen-dropdown/index.js", "undefined/deps/dropdown/index.js");

