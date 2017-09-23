'use strict';

angular.module('core')
	.factory('Connections',
		function($resource) {
			return $resource('connection-by-code/:code', { code: '@_id' }, { 'query':  { method: 'GET', isArray: false } });
		});