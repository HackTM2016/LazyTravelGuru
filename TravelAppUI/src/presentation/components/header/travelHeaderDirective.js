travelApp.directive('travelHeader', function(){
  return {
    restrict: 'E',
    scope: {},
    controller: 'TravelHeaderController',
    templateUrl: 'presentation/components/header/travelHeader.html'
  }
})
