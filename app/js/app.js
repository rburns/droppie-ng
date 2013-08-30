"use strict";

angular.module('drop', ['ngRoute', 'drop.files'])

.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
	$locationProvider.html5Mode(true);
	$routeProvider
		.when('/',
			{templateUrl: 'files/index.html',
			controller: 'filesIndexCtrl',
			resolve: { files: 'files' }
		})
		.otherwise({redirectTo: '/'});
}])

.controller('rootCtrl', ['$scope', 'uploadFile', function($scope, uploadFile){
	$scope.uploadFile = uploadFile;
}])

.directive('rbFileChange', ['$parse', function($parse){
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.bind('change', function(evt){
				scope.$apply(function(){
					$parse(attrs.rbFileChange)(scope, {$event: evt});
				});
			});
		}
	};
}]);

