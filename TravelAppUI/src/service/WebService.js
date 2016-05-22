travelApp.factory('WebService', function($http, $q){

  function get(url){
    const deferred = $q.defer();
    $http({
      method: 'GET',
      url: url,
      headers:{
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
                'X-Random-Shit':'123123123'
            }
    })
      .success(buildSuccessHandler(deferred))
      .error(function(data){
        deferred.reject(data);
      });
    return deferred.promise;
  }

  function post(url, data){
    const deferred = $q.defer();
    $http({
      method: 'POST',
      url: url,
      headers:{
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
                'X-Random-Shit':'123123123'
            },
      data: data
    })
      .success(buildSuccessHandler(deferred))
      .error(function(errorData){
        deferred.reject(errorData);
      });
    return deferred.promise;
  }

  function buildSuccessHandler(deferred){
    return function(data) {
      if (deferred.cancelled){
        return;
      }
      deferred.resolve(data);
    }
  }

  return {
    get,
    post
  }
})
