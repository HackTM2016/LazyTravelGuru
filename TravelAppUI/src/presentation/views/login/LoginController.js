travelApp.controller("LoginController", function(SessionService, $scope, $state, $rootScope, $mdDialog, $mdMedia){
  function main(){
    initScope();
  }
  function initScope(){
    //$scope.login = login;
    $scope.seeLoginForm = false;
  }

  main();

  $scope.showAdvanced = function(ev) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'presentation/views/login/loginModal.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: useFullScreen
    })
    .then(function(answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function() {
      $scope.status = 'You cancelled the dialog.';
    });
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };
});

function DialogController($scope, $mdDialog, SessionService, $state) {
  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
    $mdDialog.hide(answer);
  };
  $scope.login = login;
  function login(){
    SessionService.login($scope.user.name, $scope.user.password);
    $mdDialog.cancel();
    return $state.go('home');
  }
}
