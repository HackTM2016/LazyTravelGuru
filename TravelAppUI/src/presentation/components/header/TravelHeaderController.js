travelApp.controller('TravelHeaderController', function($scope, $mdSidenav, $log, $state, $rootScope, SessionService){

  const nextStateButton = {
    'home': 'Profile',
    'profile': 'Home',
    'updateProfile': 'Home'
  }

  const nextState = {
    'home': 'profile',
    'profile': 'home',
    'updateProfile': 'home'
  }

  function main(){
    initScope();
    listenForStateChanges();
  }

  function initScope(){
    $scope.closeSidebar = closeSidebar;
    $scope.toggleRight = buildToggler('right');
    $scope.isOpenRight = isOpenRight;
    $scope.nextPage = 'Profile';
    $scope.goToNextState = goToNextState;
    $scope.logout = logout;
    $scope.isUserLoggedIn = isUserLoggedIn;
    $scope.isLoginPage = isLoginPage;
  }

  function logout(){
    SessionService.logout();
    $state.go('login');
  }

  function listenForStateChanges(){
    $rootScope.$on('$stateChangeSuccess',
      function(event, toState, toParams, fromState, fromParams) {
        if (!isUserLoggedIn()){
          if ($state.current.name !== 'login' || $state.current.name !== 'createUser'){

            $state.go('login');
          }
        }
        $state.current = toState;
        $scope.nextPage = nextStateButton[$state.current.name];
      }
    )
  }

  function isLoginPage(){
    return $state.current.name === 'login';
  }

  function isUserLoggedIn(){
    return SessionService.isLoggedIn();
  }

  function goToNextState(){
    $state.go(nextState[$state.current.name]);
  }

  function closeSidebar () {
    $mdSidenav('right').close()
    .then(function () {
      $log.debug("close RIGHT is done");
    });
  };

  function isOpenRight(){
    return $mdSidenav('right').isOpen();
  };

  function buildToggler(navID) {
    return function() {
      $mdSidenav(navID)
      .toggle()
      .then(function () {
        $log.debug("toggle " + navID + " is done");
      });
    }
  }

  main();
})
