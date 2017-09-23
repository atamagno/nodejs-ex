'use strict';

module.exports = {

	app: {
		title: 'Weezzler',
		port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
		server: process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
	},

	dbConnectionString : function()
	{
		return 'mongodb://localhost/musicstream';
	}
};
