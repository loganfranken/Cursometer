/**
 * jQuery Cursometer Plug-in v0.1
 * Measures mouse speed
 * http://www.loganfranken.com/
 *
 * Copyright 2011, Logan Franken
 * Licensed under the MIT license
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Last Updated: 7-30-11 5:26PM
 */
(function($) {
	
	var NAMESPACE = 'cursometer';
	
	/**
	 * Creates a new Point
	 * @class	An X, Y coordinate in a 2D plane
	 * @param	{Number}	x	X-coordinate
	 * @param	{Number}	y	Y-coordinate
	 */
	function Point(x, y) {
		this.x = x;
		this.y = y;
	};
	
	/**
	 * Creates a new Historical Point
	 * @class	A Point, including the time the Point was captured
	 * @param	{Point}		point		Point
	 * @param	{Number}	timestamp	Timestamp when Point was captured
	 */
	function HistoricalPoint(point, timestamp) {
		this.point = point;
		this.timestamp = timestamp;
	};
	
	function initialize(options) {
		
		return this.each(function() {
		
			// Merge default options
			options && $.extend(_options, options);
			
			// Initialize plug-in
			var $this = $(this);
		
			// Initialize data
			var data = {
				options: options,
				_currSpeed: 0,
				_updateSpeedTimeout: null,
				_lastMousePos: null,
				_currMousePos: null,
				_hasAttachedMousemoveEvent: false
			};
			
			$this.data(NAMESPACE, data);
		
			// Initialize events
			$this.mouseenter(updateSpeed);
			$this.mouseleave(stopPolling);
			captureMousePosition.apply(this);
		
		});
	}
	
	/**
	 * @private
	 * Updates the current mouse speed
	 */
	function updateSpeed() {

		var $this = $(this);
		var data = $this.data(NAMESPACE);

		var currMousePos = data._currMousePos;
		var lastMousePos = data._lastMousePos;
	
		var speed = 0;
		
		if(currMousePos && lastMousePos)
		{
			// Calculate speed
			var distance = calcDistance(currMousePos.point, lastMousePos.point);
			speed = (distance/(currMousePos.timestamp - lastMousePos.timestamp));
		}
		
		// Update speed
		var currSpeed = data._currSpeed = speed;
		
		// Call Update Speed callback
		data.options.onUpdateSpeed && data.options.onUpdateSpeed.apply($this[0], [currSpeed]);
		
		data._updateSpeedTimeout = setTimeout(function() {
			updateSpeed.apply($this[0]);
		}, data.options.speedPollingRate);
	};

	/**
	 * @private
	 * Stops capturing mouse speed
	 */
	function stopPolling() {
	
		var $this = $(this);
		var data = $this.data(NAMESPACE);
	
		// Reset values
		data._currSpeed = 0;
		data._lastMousePosCalc = null;
		data._currMousePosCalc = null;
		data._hasAttachedMousemoveEvent = false;
	
		// Clear timeouts
		data._updateSpeedTimeout && clearTimeout(data._updateSpeedTimeout);
		
	};
	
	/**
	 * @private
	 * Captures the User's current mouse position
	 */
	function captureMousePosition()
	{
		var $this = $(this);
		var data = $this.data(NAMESPACE);
	
		// A mousemove event has already been attached to this element, don't attach another
		if(data._hasAttachedMousemoveEvent)
		{
			return;
		}
	
		// We need an event to capture the mouse's (X, Y), so we fire a quick, one-time
		// mousemove event (Credit: http://stackoverflow.com/questions/1133807/mouse-position-using-jquery-outside-of-events)
		$this.one('mousemove.' + NAMESPACE, function(event) {
		
			// Shift mouse position result data
			if(data._currMousePos)
			{
				data._lastMousePos = data._currMousePos;
			}
		
			// Get the current mouse position
			var currMouseX = event.pageX;
			var currMouseY = event.pageY;
			var currMousePos = new Point(currMouseX, currMouseY);
			data._currMousePos = new HistoricalPoint(currMousePos, (new Date()).getTime());
			
			setTimeout(function() {
				captureMousePosition.apply($this[0]);
			}, data.options.captureMouseMoveRate);

			data._hasAttachedMousemoveEvent = false;
			
		});
		
		data._hasAttachedMousemoveEvent = true;
	}
	
	/**
	 * @private
	 * Calculates the distance between two Points
	 * @param	{Point}	mousePosA	The first Point
	 * @param	{Point}	mousePosB	The second Point
	 * @return	{Number}	The distance between the two Points
	 */
	function calcDistance(mousePosA, mousePosB) {
	
		var distance = 0;
	
		if(mousePosA && mousePosB)
		{
			// Calculate distance
			var xDiff = Math.pow((mousePosA.x - mousePosB.x), 2);
			var yDiff = Math.pow((mousePosA.y - mousePosB.y), 2);
			distance = Math.sqrt(xDiff + yDiff);
		}
		
		return distance;
		
	};
	
	/**
	 * @private
	 * Returns the current speed of the cursor
	 */
	function getCurrentSpeed()
	{
		return $(this).data(NAMESPACE)._currSpeed;
	}
	
	/**
	 * @private
	 * Public methods for plug-in
	 */
	var _methods = {
		init: initialize,
		getCurrentSpeed: getCurrentSpeed
	};
	
	/**
	 * @private
	 * Configuration options for plug-in
	 */
	var _options = {
		updateSpeedRate: 20,
		captureMouseMoveRate: 15,
		onUpdateSpeed: $.noop
	};

	$.fn.cursometer = function(methodName) {
		
		if(_methods[methodName])
		{
			return _methods[methodName].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if(typeof(methodName) === 'object' || !methodName)
		{
			return _methods.init.apply(this, arguments);
		}
		else
		{
			$.error('Method ' +  methodName + ' does not exist on jQuery.cursometer');
		}
		
	};
	
})(jQuery);