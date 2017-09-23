'use strict';

module.exports = function(app) {
	// Root routing
	var core = require('../../app/controllers/core.server.controller');
	app.route('/').get(core.index);
	app.route('/connect').get(core.index);
	app.route('/video').get(core.index);
	app.route('/audio').get(core.index);
	app.route('/about').get(core.index);
	app.route('/help').get(core.index);
	app.route('/privacy').get(core.index);
};