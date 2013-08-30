"use strict";

angular.module('drop.files', [])

.controller('filesIndexCtrl', ['$scope', 'files', function($scope, files){

	console.log('files in the controller', files);
	$scope.files = files;

}]);
