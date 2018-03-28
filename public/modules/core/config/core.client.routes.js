'use strict';

angular.module('core').config(
	function($stateProvider, $urlRouterProvider) {
/*
		$urlRouterProvider.otherwise('/');

		$stateProvider.
			state('home', {
				url: '/',
				templateUrl: 'modules/core/views/main.client.view.html'
			}).
			state('privacy', {
				url: '/',
				templateUrl: 'modules/core/views/main.client.view.html'
			}).
			state('about', {
				url: '/',
				templateUrl: 'modules/core/views/main.client.view.html'
			}).
			state('help', {
				url: '/',
				templateUrl: 'modules/core/views/main.client.view.html'
			}).
			state('connect', {
				url: '/',
				templateUrl: 'modules/core/views/main.client.view.html'
			}).
			state('connect.audio', {
				url: '/',
				templateUrl: 'modules/core/views/main.client.view.html'
			}).
			state('connect.video', {
				url: '/',
				templateUrl: 'modules/core/views/main.client.view.html'
			});
*/
		$urlRouterProvider.otherwise('/connect');
		
		$stateProvider.
			state('home', {
				url: '/',
				templateUrl: 'modules/core/views/main.client.view.html'
			}).
			state('privacy', {
				url: '/privacy',
				templateUrl: 'modules/core/views/privacy.client.view.html'
			}).
			state('about', {
				url: '/about',
				templateUrl: 'modules/core/views/about.client.view.html'
			}).
			state('help', {
				url: '/help',
				templateUrl: 'modules/core/views/help.client.view.html'
			}).
			state('connect', {
				url: '/connect',
				templateUrl: 'modules/core/views/connect.client.view.html'
			}).
			state('connect.audio', {
				url: '^/audio',
				templateUrl: 'modules/core/views/audio.client.view.html'
			}).
			state('connect.video', {
				url: '^/video',
				templateUrl: 'modules/core/views/video.client.view.html'
			});
	});