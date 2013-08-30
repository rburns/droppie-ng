'use strict';

angular.module('rb.util', [])

.factory('safeApply', [function($rootScope) {
    return function($scope, fn) {
        var phase = $scope.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if (fn) {
                $scope.$eval(fn);
            }
        } else {
            if (fn) {
                $scope.$apply(fn);
            } else {
                $scope.$apply();
            }
        }
    };
}])

.factory('uniq', [function() {
	return function(array) {
		var hash = Object.create(null),
		i = array.length;

		while (i--) {
			if (!hash[array[i]]) { hash[array[i]] = true; }
			else { array.splice(array[i]); }
		}

		return array;
	};
}])

.factory('indexOfObj', [function(){
	return function removeObj(arr, attr, value){
		var i = arr.length;
		while(i--){
			if( arr[i] && arr[i][attr] === value ) {
				return i;
			}
		}
		return -1;
	};
}])

.factory('removeObj', [function(){
	return function removeObj(arr, attr, value, removeAll){
		var i = arr.length;
		removeAll = removeAll || false;
		while(i--){
			if( arr[i] && arr[i][attr] === value ) {
				arr.splice(i,1);
				if( !removeAll ) { return; }
			}
		}
	};
}]);


