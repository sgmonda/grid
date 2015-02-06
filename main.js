global.settings = require('./settings.js');
var Grid = require('./lib/grid.js');

global.debug = true;
global.log = function () {
	if (debug) {
		console.log.apply(this, arguments);
	}
};


module.exports = Grid;
