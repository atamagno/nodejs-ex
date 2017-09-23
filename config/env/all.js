'use strict';

module.exports = {

	app: {
		title: 'Weezzler'
	},

	templateEngine: 'swig',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	assets: {
		lib: {
			css: [],
			js: [
				'public/libs/angular/angular.min.js',
				'public/libs/angular-cookies/angular-cookies.min.js',
				'public/libs/angular-resource/angular-resource.min.js',
				'public/libs/angular-ui-router/release/angular-ui-router.min.js'
			]
		},
		css: [
			'public/modules/**/css/*.css'
		],
		js: [
			'public/config.js',
			'public/application.js',
			'public/modules/*/*.js',
			'public/modules/*/**/*.js'
		]
	}
};
