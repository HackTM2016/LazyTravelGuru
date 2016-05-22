travelApp.directive("travelAutocomplete", function(){
  return {
    restrict: 'E',
    scope: {
      newTags: "="
    },
    controller: 'TravelAutocompleteController',
    templateUrl: 'presentation/components/autocomplete/travelAutocomplete.html'
  }
})
