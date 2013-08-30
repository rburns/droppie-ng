
angular.module('drop.files')

.factory('files', ['$http', function($http){
	return $http.jsonp(
		'http://localhost:4567/api/v1/login',
		{params: {u: 'alvin', k: 'beer', callback: 'JSON_CALLBACK'}}
	)
	.then(function(response){
		return response.data.folders;
	}, function(error){
		return [];
	});
}])

.factory('uploadFile', [function(){
	return function(evt) {
		console.log('implement me, the file upload guy');
	};
}]);


