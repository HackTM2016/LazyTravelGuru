travelApp.controller("TravelAutocompleteController", function($scope){

    $scope.autocompleteData = {};
    $scope.autocompleteData.readonly = false;
    $scope.autocompleteData.selectedItem = null;
    $scope.autocompleteData.searchText = null;
    $scope.autocompleteData.querySearch = querySearch;
    $scope.autocompleteData.tags = loadTags();

    $scope.autocompleteData.selectedTags = [];
    $scope.newTags = $scope.autocompleteData.selectedTags;
    $scope.autocompleteData.numberChips = [];
    $scope.autocompleteData.numberChips2 = [];
    $scope.autocompleteData.numberBuffer = '';
    $scope.autocompleteData.autocompleteDemoRequireMatch = true;
    $scope.autocompleteData.transformChip = transformChip;
    /**
     * Return the proper object when the append is called.
     */
    function transformChip(chip) {
      // If it is an object, it's already a known chip
      if (angular.isObject(chip)) {
        return chip;
      }
      // Otherwise, create a new one
      return { name: chip}
    }
    function querySearch (query) {
      var results = query ? $scope.autocompleteData.tags.filter(createFilterFor(query)) : tags;
      return results;
    }
    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(tags) {
        return (tags._lowername.indexOf(lowercaseQuery) === 0) };
    }
    function loadTags() {
      let tags = []
      const tagsStrings = ["seaside", "sunny", "beach", "sand", "summer", "winter", "spring", "autumn", "nature", "sports", "food", "culture",
      "museum", "love", "holiday","snow", "tourism", "cold", "cruise ship",
      "monuments", "rainy", "hot", "cars", "relax", "roadtrip", "ocean", "island", "zoo", "tropical", "safari", "park", "country_side",
      "architecture", "lake", "river", "vulcano", "swimming", "shopping", "history", "clubbing", "music", "motorbike", "games",
      "forest", "jungle", "camping", "luxury", "water_activities", "chill", "adventure", "romance", "bicycle", "festival",
      "traditions,city_break", "europe", "asia", "africa", "north_america", "south_america", "oceania", "mountains", "church",
      "drinks", "aurora_borealis", "coffee", "theme_park", "monarchy", "science", "bussines", "casino", "mythology", "wild"];
      for (let i = 0; i < tagsStrings.length; i++){
        tags.push({
          id: i+1,
          name: tagsStrings[i],
          check: false
        })
      };

      return tags.map(function (tag) {
        tag._lowername = tag.name.toLowerCase();
        return tag;
      });
    }
})
