travelApp.controller('ProfileController', function($scope, $state){
  $scope.user = {
    name: "John Rooney",
    address: "293 Street Avenue",
    town: "Manchester",
    phone: "+42 072 354 234",
    work: "hacker"
  }
  $scope.goToEditProfile = function(){
    console.log("merge?")
    $state.go('updateProfile');
  }
})
