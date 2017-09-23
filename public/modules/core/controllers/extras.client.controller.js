'use strict';

angular.module('core').controller('ExtrasController',

	function($scope, $cookies) {

		$scope.language = $cookies.get('weezzlerLanguage');
		if ($scope.language == 'spanish') {
			$scope.spanish = true;
		}

		$scope.changeLanguage = function() {
			$scope.spanish = !$scope.spanish;
			if ($scope.spanish) {
				$cookies.put('weezzlerLanguage', 'spanish');
			} else {
				$cookies.put('weezzlerLanguage', 'english');
			}
		};
	});