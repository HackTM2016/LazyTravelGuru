'use strict';

var travelApp = angular.module('travelApp', ['ui.router', 'lumx', 'ngMaterial']);
travelApp.config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('default').primaryPalette('blue', {
    'default': '800', // by default use shade 400 from the pink palette for primary intentions
    'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
    'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
    'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
  })
  // If you specify less than all of the keys, it will inherit from the
  // default shades
  .accentPalette('red', {
    'default': '400' // use shade 200 for default, and keep all other shades the same
  });
});
travelApp.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

travelApp.config(function ($provide) {
    $provide.decorator('$q', function ($delegate) {
        var originalDefer = $delegate.defer;
        $delegate.defer = function () {
            var deferred = originalDefer.apply(this, arguments);

            deferred.cancelled = false;

            mergeCancelApiIntoPromise(null, deferred.promise, cancel);

            function cancel() {
                if (deferred.cancelled) {
                    return;
                }

                deferred.cancelled = true;

                if (deferred.cancellation) {
                    deferred.cancellation();
                }
            }

            return deferred;
        };

        var originalWhen = $delegate.when;
        $delegate.when = function () {
            var promise = originalWhen.apply(this, arguments);

            mergeCancelApiIntoPromise(null, promise, null);

            return promise;
        };

        return $delegate;
    });

    function mergeCancelApiIntoPromise(parentPromise, promise, deferredCancel) {
        var collectedPromises = [];

        var originalThen = promise.then;
        promise.then = function () {
            var originalThenCallback = arguments[0];
            var args = Array.prototype.slice.call(arguments);

            if (typeof originalThenCallback === 'function') {
                args.splice(0, 1, function (value) {
                    var result = originalThenCallback(value);

                    if ((typeof result === 'undefined' ? 'undefined' : _typeof(result)) === 'object' && result && result.cancel) {
                        collectedPromises.push(result);
                    }

                    return result;
                });
            }

            var chainedPromise = originalThen.apply(promise, args);

            mergeCancelApiIntoPromise(promise, chainedPromise, null);
            collectedPromises.push(chainedPromise);

            return chainedPromise;
        };

        var originalCatch = promise.catch;
        promise.catch = function () {
            var chainedPromise = originalCatch.apply(this, arguments);

            mergeCancelApiIntoPromise(promise, chainedPromise, null);
            collectedPromises.push(chainedPromise);

            return chainedPromise;
        };

        var originalCancel = promise.cancel;
        promise.cancel = function () {
            while (collectedPromises.length > 0) {
                var collectedPromise = collectedPromises.splice(0, 1)[0];

                collectedPromise.cancel();
            }

            if (deferredCancel) {
                deferredCancel();
            }

            if (originalCancel) {
                originalCancel();
            }

            if (parentPromise && parentPromise.cancel) {
                parentPromise.cancel();
            }
        };
    }
});
'use strict';

/*
 * angular dependency injection is not used for RoutingBuilder because
 * it's used within a vofapl.config(...) call.
 */
function RoutingBuilder($stateProvider, $urlRouterProvider) {

  // the initial default state
  $urlRouterProvider.otherwise("/home");

  function buildStates(routingConfigs) {
    for (var i = 0; i < routingConfigs.length; ++i) {
      var routingConfig = routingConfigs[i];

      addState(routingConfig.name, routingConfig.url, routingConfig.params);
    }

    addConnectionErrorState();
  }

  function addState(name, url, params) {
    url = url || '/' + name;

    var controllerName = toFirstUpper(name) + 'Controller';

    $stateProvider.state(name, {
      url: url,
      params: params,
      templateUrl: 'presentation/views/' + name + '/' + name + '.html',
      controller: controllerName
    });
  }

  function addConnectionErrorState() {
    $stateProvider.state('connectionError', {
      url: '/connectionError',
      template: '<div class="vfp-connection-error" id="contentContainer"> <div class="title" id="mainTitle">{{::\'connectionError.title\' | translate}}</div> <div class="taskSection" id="taskSection"> <ul class="tasks" id="notConnectedTasks"> <li id="task2-1">{{::\'connectionError.task.networkWire\' | translate}}</li> <li id="task2-2">{{::\'connectionError.task.airplaneMode\' | translate}}</li> <li id="task2-3">{{::\'connectionError.task.switchOnline\' | translate}}</li> <li id="task2-4">{{::\'connectionError.task.mobileConnection\' | translate}}</li> <li id="task2-5">{{::\'connectionError.task.restartRouter\' | translate}}</li> </ul> </div> </div>'
    });
  }

  function toFirstUpper(s) {
    return s[0].toUpperCase() + s.substr(1);
  }

  return {

    buildStates: buildStates

  };
}
"use strict";

travelApp.controller("TravelAutocompleteController", function ($scope) {

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
    return { name: chip };
  }
  function querySearch(query) {
    var results = query ? $scope.autocompleteData.tags.filter(createFilterFor(query)) : tags;
    return results;
  }
  /**
   * Create filter function for a query string
   */
  function createFilterFor(query) {
    var lowercaseQuery = angular.lowercase(query);
    return function filterFn(tags) {
      return tags._lowername.indexOf(lowercaseQuery) === 0;
    };
  }
  function loadTags() {
    var tags = [];
    var tagsStrings = ["seaside", "sunny", "beach", "sand", "summer", "winter", "spring", "autumn", "nature", "sports", "food", "culture", "museum", "love", "holiday", "snow", "tourism", "cold", "cruise ship", "monuments", "rainy", "hot", "cars", "relax", "roadtrip", "ocean", "island", "zoo", "tropical", "safari", "park", "country_side", "architecture", "lake", "river", "vulcano", "swimming", "shopping", "history", "clubbing", "music", "motorbike", "games", "forest", "jungle", "camping", "luxury", "water_activities", "chill", "adventure", "romance", "bicycle", "festival", "traditions,city_break", "europe", "asia", "africa", "north_america", "south_america", "oceania", "mountains", "church", "drinks", "aurora_borealis", "coffee", "theme_park", "monarchy", "science", "bussines", "casino", "mythology", "wild"];
    for (var i = 0; i < tagsStrings.length; i++) {
      tags.push({
        id: i + 1,
        name: tagsStrings[i],
        check: false
      });
    };

    return tags.map(function (tag) {
      tag._lowername = tag.name.toLowerCase();
      return tag;
    });
  }
});
'use strict';

travelApp.controller('TravelHeaderController', function ($scope, $mdSidenav, $log, $state, $rootScope, SessionService) {

  var nextStateButton = {
    'home': 'Profile',
    'profile': 'Home',
    'updateProfile': 'Home'
  };

  var nextState = {
    'home': 'profile',
    'profile': 'home',
    'updateProfile': 'home'
  };

  function main() {
    initScope();
    listenForStateChanges();
  }

  function initScope() {
    $scope.closeSidebar = closeSidebar;
    $scope.toggleRight = buildToggler('right');
    $scope.isOpenRight = isOpenRight;
    $scope.nextPage = 'Profile';
    $scope.goToNextState = goToNextState;
    $scope.logout = logout;
    $scope.isUserLoggedIn = isUserLoggedIn;
    $scope.isLoginPage = isLoginPage;
  }

  function logout() {
    SessionService.logout();
    $state.go('login');
  }

  function listenForStateChanges() {
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
      if (!isUserLoggedIn()) {
        if ($state.current.name !== 'login' || $state.current.name !== 'createUser') {

          $state.go('login');
        }
      }
      $state.current = toState;
      $scope.nextPage = nextStateButton[$state.current.name];
    });
  }

  function isLoginPage() {
    return $state.current.name === 'login';
  }

  function isUserLoggedIn() {
    return SessionService.isLoggedIn();
  }

  function goToNextState() {
    $state.go(nextState[$state.current.name]);
  }

  function closeSidebar() {
    $mdSidenav('right').close().then(function () {
      $log.debug("close RIGHT is done");
    });
  };

  function isOpenRight() {
    return $mdSidenav('right').isOpen();
  };

  function buildToggler(navID) {
    return function () {
      $mdSidenav(navID).toggle().then(function () {
        $log.debug("toggle " + navID + " is done");
      });
    };
  }

  main();
});
'use strict';

travelApp.controller('CreateProfileController', function ($scope) {});
'use strict';

travelApp.controller('HomeController', function ($scope, $mdDialog, $mdMedia, WebService) {
	function main() {
		initScope();
		getData();
	}

	function initScope() {
		$scope.data = {
			flights: []
		};
		$scope.showDetails = showDetails;
		$scope.flightsLoading = false;
		$scope.somethingWrong = false;
		$scope.pageLoading = true;
		$scope.submitNewTags = submitNewTags;
	}

	function getData() {
		$scope.somethingWrong = false;
		$scope.flightsLoading = true;
		WebService.get('/flights/fs/flight/all').then(function (response) {
			$scope.data.flights = response;
		}).catch(function (error) {
			console.log(error);
			$scope.somethingWrong = true;
		}).finally(function () {
			$scope.flightsLoading = false;
			$scope.pageLoading = false;
		});
	}

	function submitNewTags() {
		console.log($scope.newTags);
		getData();
	}

	function showDetails(ev, row) {
		var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
		$mdDialog.show({
			controller: DialogController,
			templateUrl: 'presentation/components/dialogs/detailsDialog.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose: true,
			fullscreen: useFullScreen
		}).then(function (answer) {
			$scope.status = 'You said the information was "' + answer + '".';
		}, function () {
			$scope.status = 'You cancelled the dialog.';
		});
		$scope.$watch(function () {
			return $mdMedia('xs') || $mdMedia('sm');
		}, function (wantsFullScreen) {
			$scope.customFullscreen = wantsFullScreen === true;
		});
	}

	main();
});

function DialogController($scope, $mdDialog) {
	$scope.hide = function () {
		$mdDialog.hide();
	};
	$scope.cancel = function () {
		$mdDialog.cancel();
	};
	$scope.answer = function (answer) {
		$mdDialog.hide(answer);
	};
}
'use strict';

travelApp.controller("LoginController", function (SessionService, $scope, $state, $rootScope, $mdDialog, $mdMedia) {
  function main() {
    initScope();
  }
  function initScope() {
    //$scope.login = login;
    $scope.seeLoginForm = false;
  }

  main();

  $scope.showAdvanced = function (ev) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'presentation/views/login/loginModal.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: useFullScreen
    }).then(function (answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function () {
      $scope.status = 'You cancelled the dialog.';
    });
    $scope.$watch(function () {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function (wantsFullScreen) {
      $scope.customFullscreen = wantsFullScreen === true;
    });
  };
});

function DialogController($scope, $mdDialog, SessionService, $state) {
  $scope.hide = function () {
    $mdDialog.hide();
  };
  $scope.cancel = function () {
    $mdDialog.cancel();
  };
  $scope.answer = function (answer) {
    $mdDialog.hide(answer);
  };
  $scope.login = login;
  function login() {
    SessionService.login($scope.user.name, $scope.user.password);
    $mdDialog.cancel();
    return $state.go('home');
  }
}
"use strict";

travelApp.controller('ProfileController', function ($scope, $state) {
  $scope.user = {
    name: "John Rooney",
    address: "293 Street Avenue",
    town: "Manchester",
    phone: "+42 072 354 234",
    work: "hacker"
  };
  $scope.goToEditProfile = function () {
    console.log("merge?");
    $state.go('updateProfile');
  };
});
"use strict";

travelApp.controller('UpdateProfileController', function ($scope, WebService) {
  var tags = ["seaside", "sunny", "beach", "sand", "summer", "winter", "spring", "autumn", "nature", "sports", "food", "culture", "museum", "love", "holiday", "snow", "tourism", "cold", "cruise ship", "monuments", "rainy", "hot", "cars", "relax", "roadtrip", "ocean", "island", "zoo", "tropical", "safari", "park", "country_side", "architecture", "lake", "river", "vulcano", "swimming", "shopping", "history", "clubbing", "music", "motorbike", "games", "forest", "jungle", "camping", "luxury", "water_activities", "chill", "adventure", "romance", "bicycle", "festival", "traditions,city_break", "europe", "asia", "africa", "north_america", "south_america", "oceania", "mountains", "church", "drinks", "aurora_borealis", "coffee", "theme_park", "monarchy", "science", "bussines", "casino", "mythology", "wild"];
  var tagsObjects = [];
  for (var i = 0; i < tags.length; i++) {
    tagsObjects.push({
      id: i + 1,
      name: tags[i],
      check: false
    });
  }
  //console.log(JSON.stringify(tagsObjects));

  function getTagById(id) {
    return tagsObjects[tagsObjects.map(function (x) {
      return x.id;
    }).indexOf(id)];
  }

  function getTagByName(name) {
    return tagsObjects[tagsObjects.map(function (x) {
      return x.name;
    }).indexOf(name)];
  }

  function checkTags(tagsList) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = tagsList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var tagString = _step.value;

        var tag = getTagByName(tagString);
        tag.check = true;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  function submit() {
    var questionsList = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = $scope.questions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var question = _step2.value;

        var answersList = [];
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = question.answers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var answer = _step3.value;

            if (answer.check) {
              answersList.push(answer);
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        questionsList.push({
          id: question.id,
          answers: answersList
        });
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    console.log(questionsList);
    console.log($scope.data.age);
    console.log($scope.data.gender);

    WebService.post("/user/data", {
      age: $scope.data.age,
      gender: $scope.data.gender,
      questions: questionsList
    }).then(function () {
      window.history.back();
    });
  }

  function initQuestions() {

    $scope.questionsFromServer = [{
      id: 1,
      answers: [{
        id: 1
      }, { id: 2 }]
    }];

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = $scope.questions[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var question = _step4.value;

        var answersList = getAnswerForQuestion($scope.questionsFromServer, question.id);
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = question.answers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var answer = _step5.value;

            if (answersList.indexOf(answer.id - 1) !== -1) {
              answer.check = true;
            } else {
              answer.check = false;
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  }

  function getAnswerForQuestion(questionsFromServer, id) {
    var answersChecked = [];
    if (!questionsFromServer[id - 1]) {
      return [];
    }
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = questionsFromServer[id - 1].answers[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var answer = _step6.value;

        answersChecked.push(answer.id);
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }

    return answersChecked;
  }

  function main() {
    initScope();
  }

  var questions = [{
    id: 1,
    text: "3. What kind of holiday are you looking for:",
    advice: "Just be honest",
    answers: [{
      id: 1,
      text: "City break"
    }, {
      id: 2,
      text: "Cultural"
    }, {
      id: 3,
      text: "Family"
    }, {
      id: 4,
      text: "Cruise Ship"
    }, {
      id: 5,
      text: "Romantic"
    }, {
      id: 6,
      text: "Party"
    }, {
      id: 7,
      text: "Luxury"
    }, {
      id: 8,
      text: "Pilgrimage"
    }]
  }, {
    id: 2,
    text: "4. What time of the year would you like to travel?",
    advice: "Just be honest",
    answers: [{
      id: 1,
      text: "Spring"
    }, {
      id: 2,
      text: "Summer"
    }, {
      id: 3,
      text: "Autumn"
    }, {
      id: 4,
      text: "Winter"
    }, {
      id: 5,
      text: "Holidays"
    }]
  }, {
    id: 3,
    text: "5. Price Range:",
    advice: "Just be honest",
    answers: [{
      id: 1,
      text: "<200 E"
    }, {
      id: 2,
      text: "200-500 E"
    }, {
      id: 3,
      text: "500-1000 E"
    }, {
      id: 4,
      text: ">1000"
    }]
  }, {
    id: 4,
    text: "6. How would you spend your daytime in your perfect holiday destination?",
    advice: "Just be honest",
    answers: [{
      id: 1,
      text: "Shopping"
    }, {
      id: 2,
      text: "On the beach"
    }, {
      id: 3,
      text: "Adventure"
    }, {
      id: 4,
      text: "Theme Park"
    }, {
      id: 5,
      text: "Clubbing"
    }, {
      id: 5,
      text: "Visiting attractions"
    }]
  }, {
    id: 5,
    text: "7. Interests:",
    advice: "Just be honest",
    answers: [{
      id: 1,
      text: "History"
    }, {
      id: 2,
      text: "Sports"
    }, {
      id: 3,
      text: "Music"
    }, {
      id: 4,
      text: "Science"
    }, {
      id: 5,
      text: "Food"
    }, {
      id: 5,
      text: "Architecture"
    }, {
      id: 6,
      text: "Religion"
    }]
  }, {
    id: 5,
    text: "8.What views are best for you?",
    advice: "Just be honest",
    answers: [{
      id: 1,
      text: "Panoramic Sea Views"
    }, {
      id: 2,
      text: "Panoramic Mountains View"
    }, {
      id: 3,
      text: "Countryside"
    }, {
      id: 4,
      text: "Desert and sand"
    }, {
      id: 5,
      text: "Animals, tradition, dancing and singing"
    }]
  }, {
    id: 5,
    text: "9.Where would you like to stay?",
    advice: "Just be honest",
    answers: [{
      id: 1,
      text: "In a Semi-Jungle Accomadation"
    }, {
      id: 2,
      text: "In a Holiday Village"
    }, {
      id: 3,
      text: "In a Beach Hotel"
    }, {
      id: 4,
      text: "In a 5 star hotel"
    }, {
      id: 5,
      text: "Camping"
    }]
  }, {
    id: 5,
    text: "10.Would you rather:",
    advice: "Just be honest",
    answers: [{
      id: 1,
      text: "Visit a Michelin-starred restaurant"
    }, {
      id: 2,
      text: "See monkeys swinging in the trees"
    }, {
      id: 3,
      text: "Take in spectacular views and landscapes"
    }, {
      id: 4,
      text: "Visit an ancient city"
    }]
  }];

  function initScope() {
    $scope.checkTags = checkTags;
    $scope.submit = submit;
    $scope.questions = questions;
    console.log(JSON.stringify($scope.questions));
    initQuestions();
  }
  main();
});
"use strict";

travelApp.directive("travelAutocomplete", function () {
  return {
    restrict: 'E',
    scope: {
      newTags: "="
    },
    controller: 'TravelAutocompleteController',
    templateUrl: 'presentation/components/autocomplete/travelAutocomplete.html'
  };
});
'use strict';

travelApp.directive('travelHeader', function () {
  return {
    restrict: 'E',
    scope: {},
    controller: 'TravelHeaderController',
    templateUrl: 'presentation/components/header/travelHeader.html'
  };
});
'use strict';

travelApp.directive("loadingPlane", function () {
    return {
        restrict: 'E',
        templateUrl: 'presentation/components/loadingPlane/loadingPlane.html'
    };
});
'use strict';

travelApp.factory('SessionService', function () {

  function setData(key, value) {
    sessionStorage.setItem(key, value);
  }

  function getData(key) {
    return sessionStorage.getItem(key);
  }

  function isLoggedIn() {
    return getData('usernameTravelApp') !== undefined && getData('usernameTravelApp') !== 'null';
  }

  function login(user, password) {
    setData('usernameTravelApp', user);
  }

  function logout() {
    setData('usernameTravelApp', 'null');
  }

  function getUserName() {
    return getData('usernameTravelApp');
  }

  return {
    login: login,
    isLoggedIn: isLoggedIn,
    logout: logout,
    getUserName: getUserName
  };
});
'use strict';

travelApp.factory('WebService', function ($http, $q) {

  function get(url) {
    var deferred = $q.defer();
    $http({
      method: 'GET',
      url: url,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
        'X-Random-Shit': '123123123'
      }
    }).success(buildSuccessHandler(deferred)).error(function (data) {
      deferred.reject(data);
    });
    return deferred.promise;
  }

  function post(url, data) {
    var deferred = $q.defer();
    $http({
      method: 'POST',
      url: url,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
        'X-Random-Shit': '123123123'
      },
      data: data
    }).success(buildSuccessHandler(deferred)).error(function (errorData) {
      deferred.reject(errorData);
    });
    return deferred.promise;
  }

  function buildSuccessHandler(deferred) {
    return function (data) {
      if (deferred.cancelled) {
        return;
      }
      deferred.resolve(data);
    };
  }

  return {
    get: get,
    post: post
  };
});
"use strict";

travelApp.config(function ($stateProvider, $urlRouterProvider) {
  RoutingBuilder($stateProvider, $urlRouterProvider).buildStates([{ "name": "createProfile", "url": "/createProfile" }, { "name": "home", "url": "/home" }, { "name": "login", "url": "/login" }, { "name": "profile", "url": "/profile" }, { "name": "updateProfile", "url": "/updateProfile" }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsInEuanMiLCJSb3V0aW5nQnVpbGRlci5qcyIsImNvbXBvbmVudHMvYXV0b2NvbXBsZXRlL1RyYXZlbEF1dG9jb21wbGV0ZUNvbnRyb2xsZXIuanMiLCJjb21wb25lbnRzL2hlYWRlci9UcmF2ZWxIZWFkZXJDb250cm9sbGVyLmpzIiwidmlld3MvY3JlYXRlUHJvZmlsZS9DcmVhdGVQcm9maWxlQ29udHJvbGxlci5qcyIsInZpZXdzL2hvbWUvaG9tZUNvbnRyb2xsZXIuanMiLCJ2aWV3cy9sb2dpbi9Mb2dpbkNvbnRyb2xsZXIuanMiLCJ2aWV3cy9wcm9maWxlL1Byb2ZpbGVDb250cm9sbGVyLmpzIiwidmlld3MvdXBkYXRlUHJvZmlsZS9VcGRhdGVQcm9maWxlQ29udHJvbGxlci5qcyIsImNvbXBvbmVudHMvYXV0b2NvbXBsZXRlL2F1dG9jb21wbGV0ZURpcmVjdGl2ZS5qcyIsImNvbXBvbmVudHMvaGVhZGVyL3RyYXZlbEhlYWRlckRpcmVjdGl2ZS5qcyIsImNvbXBvbmVudHMvbG9hZGluZ1BsYW5lL2xvYWRpbmdQbGFuZURpcmVjdGl2ZS5qcyIsIlNlc3Npb25TZXJ2aWNlLmpzIiwiV2ViU2VydmljZS5qcyIsInJvdXRpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFNLFlBQVksUUFBUSxNQUFSLENBQWUsV0FBZixFQUE0QixDQUM1QyxXQUQ0QyxFQUU1QyxNQUY0QyxFQUc1QyxZQUg0QyxDQUE1QixDQUFsQjtBQUtBLFVBQVUsTUFBVixDQUFpQixVQUFTLGtCQUFULEVBQTZCO0FBQzVDLHFCQUFtQixLQUFuQixDQUF5QixTQUF6QixFQUNHLGNBREgsQ0FDa0IsTUFEbEIsRUFDMEI7QUFDdEIsZUFBVyxLQURXO0FBRXRCLGFBQVMsS0FGYTtBQUd0QixhQUFTLEtBSGE7QUFJdEIsYUFBUztBQUphLEdBRDFCOzs7QUFBQSxHQVNHLGFBVEgsQ0FTaUIsS0FUakIsRUFTd0I7QUFDcEIsZUFBVztBQURTLEdBVHhCO0FB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USxDQUFuVSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB0cmF2ZWxBcHAgPSBhbmd1bGFyLm1vZHVsZSgndHJhdmVsQXBwJywgW1xyXG4gICd1aS5yb3V0ZXInLFxyXG4gICdsdW14JyxcclxuICAnbmdNYXRlcmlhbCdcclxuXSk7XHJcbnRyYXZlbEFwcC5jb25maWcoZnVuY3Rpb24oJG1kVGhlbWluZ1Byb3ZpZGVyKSB7XHJcbiAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdkZWZhdWx0JylcclxuICAgIC5wcmltYXJ5UGFsZXR0ZSgnYmx1ZScsIHtcclxuICAgICAgJ2RlZmF1bHQnOiAnODAwJywgLy8gYnkgZGVmYXVsdCB1c2Ugc2hhZGUgNDAwIGZyb20gdGhlIHBpbmsgcGFsZXR0ZSBmb3IgcHJpbWFyeSBpbnRlbnRpb25zXHJcbiAgICAgICdodWUtMSc6ICcxMDAnLCAvLyB1c2Ugc2hhZGUgMTAwIGZvciB0aGUgPGNvZGU+bWQtaHVlLTE8L2NvZGU+IGNsYXNzXHJcbiAgICAgICdodWUtMic6ICc2MDAnLCAvLyB1c2Ugc2hhZGUgNjAwIGZvciB0aGUgPGNvZGU+bWQtaHVlLTI8L2NvZGU+IGNsYXNzXHJcbiAgICAgICdodWUtMyc6ICdBMTAwJyAvLyB1c2Ugc2hhZGUgQTEwMCBmb3IgdGhlIDxjb2RlPm1kLWh1ZS0zPC9jb2RlPiBjbGFzc1xyXG4gICAgfSlcclxuICAgIC8vIElmIHlvdSBzcGVjaWZ5IGxlc3MgdGhhbiBhbGwgb2YgdGhlIGtleXMsIGl0IHdpbGwgaW5oZXJpdCBmcm9tIHRoZVxyXG4gICAgLy8gZGVmYXVsdCBzaGFkZXNcclxuICAgIC5hY2NlbnRQYWxldHRlKCdyZWQnLCB7XHJcbiAgICAgICdkZWZhdWx0JzogJzQwMCcgLy8gdXNlIHNoYWRlIDIwMCBmb3IgZGVmYXVsdCwgYW5kIGtlZXAgYWxsIG90aGVyIHNoYWRlcyB0aGUgc2FtZVxyXG4gICAgfSk7XHJcbn0pO1xyXG50cmF2ZWxBcHAuY29uZmlnKFsnJGh0dHBQcm92aWRlcicsIGZ1bmN0aW9uKCRodHRwUHJvdmlkZXIpIHtcclxuICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xyXG4gICAgICAgIGRlbGV0ZSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ107XHJcbiAgICB9XHJcbl0pO1xyXG4iLCJ0cmF2ZWxBcHAuY29uZmlnKGZ1bmN0aW9uKCRwcm92aWRlKXtcbiAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRxJywgZnVuY3Rpb24oJGRlbGVnYXRlKXtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxEZWZlciA9ICRkZWxlZ2F0ZS5kZWZlcjtcbiAgICAgICAgJGRlbGVnYXRlLmRlZmVyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNvbnN0IGRlZmVycmVkID0gb3JpZ2luYWxEZWZlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5jYW5jZWxsZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgbWVyZ2VDYW5jZWxBcGlJbnRvUHJvbWlzZShudWxsLCBkZWZlcnJlZC5wcm9taXNlLCBjYW5jZWwpO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBjYW5jZWwoKXtcbiAgICAgICAgICAgICAgICBpZihkZWZlcnJlZC5jYW5jZWxsZWQpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQuY2FuY2VsbGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmKGRlZmVycmVkLmNhbmNlbGxhdGlvbil7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLmNhbmNlbGxhdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9yaWdpbmFsV2hlbiA9ICRkZWxlZ2F0ZS53aGVuO1xuICAgICAgICAkZGVsZWdhdGUud2hlbiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gb3JpZ2luYWxXaGVuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIG1lcmdlQ2FuY2VsQXBpSW50b1Byb21pc2UobnVsbCwgcHJvbWlzZSwgbnVsbCk7XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXJnZUNhbmNlbEFwaUludG9Qcm9taXNlKHBhcmVudFByb21pc2UsIHByb21pc2UsIGRlZmVycmVkQ2FuY2VsKXtcbiAgICAgICAgY29uc3QgY29sbGVjdGVkUHJvbWlzZXMgPSBbXTtcblxuICAgICAgICBjb25zdCBvcmlnaW5hbFRoZW4gPSBwcm9taXNlLnRoZW47XG4gICAgICAgIHByb21pc2UudGhlbiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbFRoZW5DYWxsYmFjayA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICBpZih0eXBlb2Yob3JpZ2luYWxUaGVuQ2FsbGJhY2spID09PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgICAgICBhcmdzLnNwbGljZSgwLCAxLCBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsVGhlbkNhbGxiYWNrKHZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZih0eXBlb2YocmVzdWx0KSA9PT0gJ29iamVjdCcgJiYgcmVzdWx0ICYmIHJlc3VsdC5jYW5jZWwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGVkUHJvbWlzZXMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2hhaW5lZFByb21pc2UgPSBvcmlnaW5hbFRoZW4uYXBwbHkocHJvbWlzZSwgYXJncyk7XG5cbiAgICAgICAgICAgIG1lcmdlQ2FuY2VsQXBpSW50b1Byb21pc2UocHJvbWlzZSwgY2hhaW5lZFByb21pc2UsIG51bGwpO1xuICAgICAgICAgICAgY29sbGVjdGVkUHJvbWlzZXMucHVzaChjaGFpbmVkUHJvbWlzZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBjaGFpbmVkUHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvcmlnaW5hbENhdGNoID0gcHJvbWlzZS5jYXRjaDtcbiAgICAgICAgcHJvbWlzZS5jYXRjaCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjb25zdCBjaGFpbmVkUHJvbWlzZSA9IG9yaWdpbmFsQ2F0Y2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgbWVyZ2VDYW5jZWxBcGlJbnRvUHJvbWlzZShwcm9taXNlLCBjaGFpbmVkUHJvbWlzZSwgbnVsbCk7XG4gICAgICAgICAgICBjb2xsZWN0ZWRQcm9taXNlcy5wdXNoKGNoYWluZWRQcm9taXNlKTtcblxuICAgICAgICAgICAgcmV0dXJuIGNoYWluZWRQcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9yaWdpbmFsQ2FuY2VsID0gcHJvbWlzZS5jYW5jZWw7XG4gICAgICAgIHByb21pc2UuY2FuY2VsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoaWxlKGNvbGxlY3RlZFByb21pc2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbGxlY3RlZFByb21pc2UgPSBjb2xsZWN0ZWRQcm9taXNlcy5zcGxpY2UoMCwgMSlbMF07XG5cbiAgICAgICAgICAgICAgICBjb2xsZWN0ZWRQcm9taXNlLmNhbmNlbCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihkZWZlcnJlZENhbmNlbCl7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWRDYW5jZWwoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYob3JpZ2luYWxDYW5jZWwpe1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsQ2FuY2VsKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHBhcmVudFByb21pc2UgJiYgcGFyZW50UHJvbWlzZS5jYW5jZWwpe1xuICAgICAgICAgICAgICAgIHBhcmVudFByb21pc2UuY2FuY2VsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufSk7XG4iLCIvKlxyXG4gKiBhbmd1bGFyIGRlcGVuZGVuY3kgaW5qZWN0aW9uIGlzIG5vdCB1c2VkIGZvciBSb3V0aW5nQnVpbGRlciBiZWNhdXNlXHJcbiAqIGl0J3MgdXNlZCB3aXRoaW4gYSB2b2ZhcGwuY29uZmlnKC4uLikgY2FsbC5cclxuICovXHJcbmZ1bmN0aW9uIFJvdXRpbmdCdWlsZGVyKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpe1xyXG5cclxuICAvLyB0aGUgaW5pdGlhbCBkZWZhdWx0IHN0YXRlXHJcbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcIi9ob21lXCIpO1xyXG5cclxuICBmdW5jdGlvbiBidWlsZFN0YXRlcyhyb3V0aW5nQ29uZmlncyl7XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgcm91dGluZ0NvbmZpZ3MubGVuZ3RoOyArK2kpe1xyXG4gICAgICB2YXIgcm91dGluZ0NvbmZpZyA9IHJvdXRpbmdDb25maWdzW2ldO1xyXG5cclxuICAgICAgYWRkU3RhdGUocm91dGluZ0NvbmZpZy5uYW1lLCByb3V0aW5nQ29uZmlnLnVybCwgcm91dGluZ0NvbmZpZy5wYXJhbXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENvbm5lY3Rpb25FcnJvclN0YXRlKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBhZGRTdGF0ZShuYW1lLCB1cmwsIHBhcmFtcyl7XHJcbiAgICB1cmwgPSB1cmwgfHwgJy8nICsgbmFtZTtcclxuXHJcbiAgICB2YXIgY29udHJvbGxlck5hbWUgPSB0b0ZpcnN0VXBwZXIobmFtZSkgKyAnQ29udHJvbGxlcic7XHJcblxyXG4gICAgJHN0YXRlUHJvdmlkZXJcclxuICAgICAgLnN0YXRlKG5hbWUsIHtcclxuICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICBwYXJhbXM6IHBhcmFtcyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3ByZXNlbnRhdGlvbi92aWV3cy8nICsgbmFtZSArICcvJyArIG5hbWUgKyAnLmh0bWwnLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6IGNvbnRyb2xsZXJOYW1lXHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYWRkQ29ubmVjdGlvbkVycm9yU3RhdGUoKXtcclxuICAgICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAgICAgLnN0YXRlKCdjb25uZWN0aW9uRXJyb3InLCB7XHJcbiAgICAgICAgICB1cmw6ICcvY29ubmVjdGlvbkVycm9yJyxcclxuICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInZmcC1jb25uZWN0aW9uLWVycm9yXCIgaWQ9XCJjb250ZW50Q29udGFpbmVyXCI+IDxkaXYgY2xhc3M9XCJ0aXRsZVwiIGlkPVwibWFpblRpdGxlXCI+e3s6OlxcJ2Nvbm5lY3Rpb25FcnJvci50aXRsZVxcJyB8IHRyYW5zbGF0ZX19PC9kaXY+IDxkaXYgY2xhc3M9XCJ0YXNrU2VjdGlvblwiIGlkPVwidGFza1NlY3Rpb25cIj4gPHVsIGNsYXNzPVwidGFza3NcIiBpZD1cIm5vdENvbm5lY3RlZFRhc2tzXCI+IDxsaSBpZD1cInRhc2syLTFcIj57ezo6XFwnY29ubmVjdGlvbkVycm9yLnRhc2submV0d29ya1dpcmVcXCcgfCB0cmFuc2xhdGV9fTwvbGk+IDxsaSBpZD1cInRhc2syLTJcIj57ezo6XFwnY29ubmVjdGlvbkVycm9yLnRhc2suYWlycGxhbmVNb2RlXFwnIHwgdHJhbnNsYXRlfX08L2xpPiA8bGkgaWQ9XCJ0YXNrMi0zXCI+e3s6OlxcJ2Nvbm5lY3Rpb25FcnJvci50YXNrLnN3aXRjaE9ubGluZVxcJyB8IHRyYW5zbGF0ZX19PC9saT4gPGxpIGlkPVwidGFzazItNFwiPnt7OjpcXCdjb25uZWN0aW9uRXJyb3IudGFzay5tb2JpbGVDb25uZWN0aW9uXFwnIHwgdHJhbnNsYXRlfX08L2xpPiA8bGkgaWQ9XCJ0YXNrMi01XCI+e3s6OlxcJ2Nvbm5lY3Rpb25FcnJvci50YXNrLnJlc3RhcnRSb3V0ZXJcXCcgfCB0cmFuc2xhdGV9fTwvbGk+IDwvdWw+IDwvZGl2PiA8L2Rpdj4nLFxyXG4gICAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdG9GaXJzdFVwcGVyKHMpe1xyXG4gICAgcmV0dXJuIHNbMF0udG9VcHBlckNhc2UoKSArIHMuc3Vic3RyKDEpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuXHJcbiAgICBidWlsZFN0YXRlczogYnVpbGRTdGF0ZXNcclxuXHJcbiAgfTtcclxufVxyXG4iLCJ0cmF2ZWxBcHAuY29udHJvbGxlcihcIlRyYXZlbEF1dG9jb21wbGV0ZUNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHNjb3BlKXtcclxuXHJcbiAgICAkc2NvcGUuYXV0b2NvbXBsZXRlRGF0YSA9IHt9O1xyXG4gICAgJHNjb3BlLmF1dG9jb21wbGV0ZURhdGEucmVhZG9ubHkgPSBmYWxzZTtcclxuICAgICRzY29wZS5hdXRvY29tcGxldGVEYXRhLnNlbGVjdGVkSXRlbSA9IG51bGw7XHJcbiAgICAkc2NvcGUuYXV0b2NvbXBsZXRlRGF0YS5zZWFyY2hUZXh0ID0gbnVsbDtcclxuICAgICRzY29wZS5hdXRvY29tcGxldGVEYXRhLnF1ZXJ5U2VhcmNoID0gcXVlcnlTZWFyY2g7XHJcbiAgICAkc2NvcGUuYXV0b2NvbXBsZXRlRGF0YS50YWdzID0gbG9hZFRhZ3MoKTtcclxuXHJcbiAgICAkc2NvcGUuYXV0b2NvbXBsZXRlRGF0YS5zZWxlY3RlZFRhZ3MgPSBbXTtcclxuICAgICRzY29wZS5uZXdUYWdzID0gJHNjb3BlLmF1dG9jb21wbGV0ZURhdGEuc2VsZWN0ZWRUYWdzO1xyXG4gICAgJHNjb3BlLmF1dG9jb21wbGV0ZURhdGEubnVtYmVyQ2hpcHMgPSBbXTtcclxuICAgICRzY29wZS5hdXRvY29tcGxldGVEYXRhLm51bWJlckNoaXBzMiA9IFtdO1xyXG4gICAgJHNjb3BlLmF1dG9jb21wbGV0ZURhdGEubnVtYmVyQnVmZmVyID0gJyc7XHJcbiAgICAkc2NvcGUuYXV0b2NvbXBsZXRlRGF0YS5hdXRvY29tcGxldGVEZW1vUmVxdWlyZU1hdGNoID0gdHJ1ZTtcclxuICAgICRzY29wZS5hdXRvY29tcGxldGVEYXRhLnRyYW5zZm9ybUNoaXAgPSB0cmFuc2Zvcm1DaGlwO1xyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gdGhlIHByb3BlciBvYmplY3Qgd2hlbiB0aGUgYXBwZW5kIGlzIGNhbGxlZC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdHJhbnNmb3JtQ2hpcChjaGlwKSB7XHJcbiAgICAgIC8vIElmIGl0IGlzIGFuIG9iamVjdCwgaXQncyBhbHJlYWR5IGEga25vd24gY2hpcFxyXG4gICAgICBpZiAoYW5ndWxhci5pc09iamVjdChjaGlwKSkge1xyXG4gICAgICAgIHJldHVybiBjaGlwO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIGEgbmV3IG9uZVxyXG4gICAgICByZXR1cm4geyBuYW1lOiBjaGlwfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcXVlcnlTZWFyY2ggKHF1ZXJ5KSB7XHJcbiAgICAgIHZhciByZXN1bHRzID0gcXVlcnkgPyAkc2NvcGUuYXV0b2NvbXBsZXRlRGF0YS50YWdzLmZpbHRlcihjcmVhdGVGaWx0ZXJGb3IocXVlcnkpKSA6IHRhZ3M7XHJcbiAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgZmlsdGVyIGZ1bmN0aW9uIGZvciBhIHF1ZXJ5IHN0cmluZ1xyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVGaWx0ZXJGb3IocXVlcnkpIHtcclxuICAgICAgdmFyIGxvd2VyY2FzZVF1ZXJ5ID0gYW5ndWxhci5sb3dlcmNhc2UocXVlcnkpO1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gZmlsdGVyRm4odGFncykge1xyXG4gICAgICAgIHJldHVybiAodGFncy5fbG93ZXJuYW1lLmluZGV4T2YobG93ZXJjYXNlUXVlcnkpID09PSAwKSB9O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbG9hZFRhZ3MoKSB7XHJcbiAgICAgIGxldCB0YWdzID0gW11cclxuICAgICAgY29uc3QgdGFnc1N0cmluZ3MgPSBbXCJzZWFzaWRlXCIsIFwic3VubnlcIiwgXCJiZWFjaFwiLCBcInNhbmRcIiwgXCJzdW1tZXJcIiwgXCJ3aW50ZXJcIiwgXCJzcHJpbmdcIiwgXCJhdXR1bW5cIiwgXCJuYXR1cmVcIiwgXCJzcG9ydHNcIiwgXCJmb29kXCIsIFwiY3VsdHVyZVwiLFxyXG4gICAgICBcIm11c2V1bVwiLCBcImxvdmVcIiwgXCJob2xpZGF5XCIsXCJzbm93XCIsIFwidG91cmlzbVwiLCBcImNvbGRcIiwgXCJjcnVpc2Ugc2hpcFwiLFxyXG4gICAgICBcIm1vbnVtZW50c1wiLCBcInJhaW55XCIsIFwiaG90XCIsIFwiY2Fyc1wiLCBcInJlbGF4XCIsIFwicm9hZHRyaXBcIiwgXCJvY2VhblwiLCBcImlzbGFuZFwiLCBcInpvb1wiLCBcInRyb3BpY2FsXCIsIFwic2FmYXJpXCIsIFwicGFya1wiLCBcImNvdW50cnlfc2lkZVwiLFxyXG4gICAgICBcImFyY2hpdGVjdHVyZVwiLCBcImxha2VcIiwgXCJyaXZlclwiLCBcInZ1bGNhbm9cIiwgXCJzd2ltbWluZ1wiLCBcInNob3BwaW5nXCIsIFwiaGlzdG9yeVwiLCBcImNsdWJiaW5nXCIsIFwibXVzaWNcIiwgXCJtb3RvcmJpa2VcIiwgXCJnYW1lc1wiLFxyXG4gICAgICBcImZvcmVzdFwiLCBcImp1bmdsZVwiLCBcImNhbXBpbmdcIiwgXCJsdXh1cnlcIiwgXCJ3YXRlcl9hY3Rpdml0aWVzXCIsIFwiY2hpbGxcIiwgXCJhZHZlbnR1cmVcIiwgXCJyb21hbmNlXCIsIFwiYmljeWNsZVwiLCBcImZlc3RpdmFsXCIsXHJcbiAgICAgIFwidHJhZGl0aW9ucyxjaXR5X2JyZWFrXCIsIFwiZXVyb3BlXCIsIFwiYXNpYVwiLCBcImFmcmljYVwiLCBcIm5vcnRoX2FtZXJpY2FcIiwgXCJzb3V0aF9hbWVyaWNhXCIsIFwib2NlYW5pYVwiLCBcIm1vdW50YWluc1wiLCBcImNodXJjaFwiLFxyXG4gICAgICBcImRyaW5rc1wiLCBcImF1cm9yYV9ib3JlYWxpc1wiLCBcImNvZmZlZVwiLCBcInRoZW1lX3BhcmtcIiwgXCJtb25hcmNoeVwiLCBcInNjaWVuY2VcIiwgXCJidXNzaW5lc1wiLCBcImNhc2lub1wiLCBcIm15dGhvbG9neVwiLCBcIndpbGRcIl07XHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFnc1N0cmluZ3MubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIHRhZ3MucHVzaCh7XHJcbiAgICAgICAgICBpZDogaSsxLFxyXG4gICAgICAgICAgbmFtZTogdGFnc1N0cmluZ3NbaV0sXHJcbiAgICAgICAgICBjaGVjazogZmFsc2VcclxuICAgICAgICB9KVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIHRhZ3MubWFwKGZ1bmN0aW9uICh0YWcpIHtcclxuICAgICAgICB0YWcuX2xvd2VybmFtZSA9IHRhZy5uYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbn0pXHJcbiIsInRyYXZlbEFwcC5jb250cm9sbGVyKCdUcmF2ZWxIZWFkZXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkbWRTaWRlbmF2LCAkbG9nLCAkc3RhdGUsICRyb290U2NvcGUsIFNlc3Npb25TZXJ2aWNlKXtcclxuXHJcbiAgY29uc3QgbmV4dFN0YXRlQnV0dG9uID0ge1xyXG4gICAgJ2hvbWUnOiAnUHJvZmlsZScsXHJcbiAgICAncHJvZmlsZSc6ICdIb21lJyxcclxuICAgICd1cGRhdGVQcm9maWxlJzogJ0hvbWUnXHJcbiAgfVxyXG5cclxuICBjb25zdCBuZXh0U3RhdGUgPSB7XHJcbiAgICAnaG9tZSc6ICdwcm9maWxlJyxcclxuICAgICdwcm9maWxlJzogJ2hvbWUnLFxyXG4gICAgJ3VwZGF0ZVByb2ZpbGUnOiAnaG9tZSdcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1haW4oKXtcclxuICAgIGluaXRTY29wZSgpO1xyXG4gICAgbGlzdGVuRm9yU3RhdGVDaGFuZ2VzKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpbml0U2NvcGUoKXtcclxuICAgICRzY29wZS5jbG9zZVNpZGViYXIgPSBjbG9zZVNpZGViYXI7XHJcbiAgICAkc2NvcGUudG9nZ2xlUmlnaHQgPSBidWlsZFRvZ2dsZXIoJ3JpZ2h0Jyk7XHJcbiAgICAkc2NvcGUuaXNPcGVuUmlnaHQgPSBpc09wZW5SaWdodDtcclxuICAgICRzY29wZS5uZXh0UGFnZSA9ICdQcm9maWxlJztcclxuICAgICRzY29wZS5nb1RvTmV4dFN0YXRlID0gZ29Ub05leHRTdGF0ZTtcclxuICAgICRzY29wZS5sb2dvdXQgPSBsb2dvdXQ7XHJcbiAgICAkc2NvcGUuaXNVc2VyTG9nZ2VkSW4gPSBpc1VzZXJMb2dnZWRJbjtcclxuICAgICRzY29wZS5pc0xvZ2luUGFnZSA9IGlzTG9naW5QYWdlO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbG9nb3V0KCl7XHJcbiAgICBTZXNzaW9uU2VydmljZS5sb2dvdXQoKTtcclxuICAgICRzdGF0ZS5nbygnbG9naW4nKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGxpc3RlbkZvclN0YXRlQ2hhbmdlcygpe1xyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLFxyXG4gICAgICBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGlmICghaXNVc2VyTG9nZ2VkSW4oKSl7XHJcbiAgICAgICAgICBpZiAoJHN0YXRlLmN1cnJlbnQubmFtZSAhPT0gJ2xvZ2luJyB8fCAkc3RhdGUuY3VycmVudC5uYW1lICE9PSAnY3JlYXRlVXNlcicpe1xyXG5cclxuICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAkc3RhdGUuY3VycmVudCA9IHRvU3RhdGU7XHJcbiAgICAgICAgJHNjb3BlLm5leHRQYWdlID0gbmV4dFN0YXRlQnV0dG9uWyRzdGF0ZS5jdXJyZW50Lm5hbWVdO1xyXG4gICAgICB9XHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpc0xvZ2luUGFnZSgpe1xyXG4gICAgcmV0dXJuICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT09ICdsb2dpbic7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpc1VzZXJMb2dnZWRJbigpe1xyXG4gICAgcmV0dXJuIFNlc3Npb25TZXJ2aWNlLmlzTG9nZ2VkSW4oKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdvVG9OZXh0U3RhdGUoKXtcclxuICAgICRzdGF0ZS5nbyhuZXh0U3RhdGVbJHN0YXRlLmN1cnJlbnQubmFtZV0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY2xvc2VTaWRlYmFyICgpIHtcclxuICAgICRtZFNpZGVuYXYoJ3JpZ2h0JykuY2xvc2UoKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAkbG9nLmRlYnVnKFwiY2xvc2UgUklHSFQgaXMgZG9uZVwiKTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIGZ1bmN0aW9uIGlzT3BlblJpZ2h0KCl7XHJcbiAgICByZXR1cm4gJG1kU2lkZW5hdigncmlnaHQnKS5pc09wZW4oKTtcclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBidWlsZFRvZ2dsZXIobmF2SUQpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgJG1kU2lkZW5hdihuYXZJRClcclxuICAgICAgLnRvZ2dsZSgpXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkbG9nLmRlYnVnKFwidG9nZ2xlIFwiICsgbmF2SUQgKyBcIiBpcyBkb25lXCIpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIG1haW4oKTtcclxufSlcclxuIiwidHJhdmVsQXBwLmNvbnRyb2xsZXIoJ0NyZWF0ZVByb2ZpbGVDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlKXtcclxuICBcclxufSlcclxuIiwidHJhdmVsQXBwLmNvbnRyb2xsZXIoJ0hvbWVDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCRtZERpYWxvZywgJG1kTWVkaWEsIFdlYlNlcnZpY2Upe1xyXG5cdGZ1bmN0aW9uIG1haW4oKXtcclxuXHRcdGluaXRTY29wZSgpO1xyXG5cdFx0Z2V0RGF0YSgpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdFNjb3BlKCl7XHJcblx0XHQkc2NvcGUuZGF0YSA9IHtcclxuXHRcdFx0ZmxpZ2h0czogW11cclxuXHRcdH07XHJcblx0XHQkc2NvcGUuc2hvd0RldGFpbHMgPSBzaG93RGV0YWlscztcclxuXHRcdCRzY29wZS5mbGlnaHRzTG9hZGluZyA9IGZhbHNlO1xyXG5cdFx0JHNjb3BlLnNvbWV0aGluZ1dyb25nID0gZmFsc2U7XHJcblx0XHQkc2NvcGUucGFnZUxvYWRpbmcgPSB0cnVlO1xyXG5cdFx0JHNjb3BlLnN1Ym1pdE5ld1RhZ3MgPSBzdWJtaXROZXdUYWdzO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0RGF0YSgpe1xyXG5cdFx0JHNjb3BlLnNvbWV0aGluZ1dyb25nID0gZmFsc2U7XHJcblx0XHQkc2NvcGUuZmxpZ2h0c0xvYWRpbmcgPSB0cnVlO1xyXG5cdFx0V2ViU2VydmljZS5nZXQoJy9mbGlnaHRzL2ZzL2ZsaWdodC9hbGwnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcblx0XHRcdFx0JHNjb3BlLmRhdGEuZmxpZ2h0cyA9IHJlc3BvbnNlO1xyXG5cclxuXHRcdFx0fSlcclxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XHJcblx0XHRcdFx0JHNjb3BlLnNvbWV0aGluZ1dyb25nID0gdHJ1ZTtcclxuXHRcdFx0fSlcclxuXHRcdFx0LmZpbmFsbHkoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHQkc2NvcGUuZmxpZ2h0c0xvYWRpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHQkc2NvcGUucGFnZUxvYWRpbmcgPSBmYWxzZTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzdWJtaXROZXdUYWdzKCl7XHJcblx0XHRjb25zb2xlLmxvZygkc2NvcGUubmV3VGFncyk7XHJcblx0XHRnZXREYXRhKCk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzaG93RGV0YWlscyhldiwgcm93KXtcclxuXHRcdHZhciB1c2VGdWxsU2NyZWVuID0gKCRtZE1lZGlhKCdzbScpIHx8ICRtZE1lZGlhKCd4cycpKSAgJiYgJHNjb3BlLmN1c3RvbUZ1bGxzY3JlZW47XHJcblx0XHQkbWREaWFsb2cuc2hvdyh7XHJcblx0XHRcdGNvbnRyb2xsZXI6IERpYWxvZ0NvbnRyb2xsZXIsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAncHJlc2VudGF0aW9uL2NvbXBvbmVudHMvZGlhbG9ncy9kZXRhaWxzRGlhbG9nLmh0bWwnLFxyXG5cdFx0XHRwYXJlbnQ6IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KSxcclxuXHRcdFx0dGFyZ2V0RXZlbnQ6IGV2LFxyXG5cdFx0XHRjbGlja091dHNpZGVUb0Nsb3NlOnRydWUsXHJcblx0XHRcdGZ1bGxzY3JlZW46IHVzZUZ1bGxTY3JlZW5cclxuXHRcdH0pXHJcblx0XHQudGhlbihmdW5jdGlvbihhbnN3ZXIpIHtcclxuXHRcdFx0JHNjb3BlLnN0YXR1cyA9ICdZb3Ugc2FpZCB0aGUgaW5mb3JtYXRpb24gd2FzIFwiJyArIGFuc3dlciArICdcIi4nO1xyXG5cdFx0fSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdCRzY29wZS5zdGF0dXMgPSAnWW91IGNhbmNlbGxlZCB0aGUgZGlhbG9nLic7XHJcblx0XHR9KTtcclxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiAkbWRNZWRpYSgneHMnKSB8fCAkbWRNZWRpYSgnc20nKTtcclxuXHRcdH0sIGZ1bmN0aW9uKHdhbnRzRnVsbFNjcmVlbikge1xyXG5cdFx0XHQkc2NvcGUuY3VzdG9tRnVsbHNjcmVlbiA9ICh3YW50c0Z1bGxTY3JlZW4gPT09IHRydWUpO1xyXG5cdFx0fSk7XHJcblxyXG5cdH1cclxuXHJcblx0bWFpbigpO1xyXG59KVxyXG5cclxuZnVuY3Rpb24gRGlhbG9nQ29udHJvbGxlcigkc2NvcGUsICRtZERpYWxvZykge1xyXG4gICRzY29wZS5oaWRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAkbWREaWFsb2cuaGlkZSgpO1xyXG4gIH07XHJcbiAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xyXG4gIH07XHJcbiAgJHNjb3BlLmFuc3dlciA9IGZ1bmN0aW9uKGFuc3dlcikge1xyXG4gICAgJG1kRGlhbG9nLmhpZGUoYW5zd2VyKTtcclxuICB9O1xyXG5cclxuXHJcblxyXG59XHJcbiIsInRyYXZlbEFwcC5jb250cm9sbGVyKFwiTG9naW5Db250cm9sbGVyXCIsIGZ1bmN0aW9uKFNlc3Npb25TZXJ2aWNlLCAkc2NvcGUsICRzdGF0ZSwgJHJvb3RTY29wZSwgJG1kRGlhbG9nLCAkbWRNZWRpYSl7XHJcbiAgZnVuY3Rpb24gbWFpbigpe1xyXG4gICAgaW5pdFNjb3BlKCk7XHJcbiAgfVxyXG4gIGZ1bmN0aW9uIGluaXRTY29wZSgpe1xyXG4gICAgLy8kc2NvcGUubG9naW4gPSBsb2dpbjtcclxuICAgICRzY29wZS5zZWVMb2dpbkZvcm0gPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIG1haW4oKTtcclxuXHJcbiAgJHNjb3BlLnNob3dBZHZhbmNlZCA9IGZ1bmN0aW9uKGV2KSB7XHJcbiAgICB2YXIgdXNlRnVsbFNjcmVlbiA9ICgkbWRNZWRpYSgnc20nKSB8fCAkbWRNZWRpYSgneHMnKSkgICYmICRzY29wZS5jdXN0b21GdWxsc2NyZWVuO1xyXG4gICAgJG1kRGlhbG9nLnNob3coe1xyXG4gICAgICBjb250cm9sbGVyOiBEaWFsb2dDb250cm9sbGVyLFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ByZXNlbnRhdGlvbi92aWV3cy9sb2dpbi9sb2dpbk1vZGFsLmh0bWwnLFxyXG4gICAgICBwYXJlbnQ6IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KSxcclxuICAgICAgdGFyZ2V0RXZlbnQ6IGV2LFxyXG4gICAgICBjbGlja091dHNpZGVUb0Nsb3NlOnRydWUsXHJcbiAgICAgIGZ1bGxzY3JlZW46IHVzZUZ1bGxTY3JlZW5cclxuICAgIH0pXHJcbiAgICAudGhlbihmdW5jdGlvbihhbnN3ZXIpIHtcclxuICAgICAgJHNjb3BlLnN0YXR1cyA9ICdZb3Ugc2FpZCB0aGUgaW5mb3JtYXRpb24gd2FzIFwiJyArIGFuc3dlciArICdcIi4nO1xyXG4gICAgfSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICRzY29wZS5zdGF0dXMgPSAnWW91IGNhbmNlbGxlZCB0aGUgZGlhbG9nLic7XHJcbiAgICB9KTtcclxuICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAkbWRNZWRpYSgneHMnKSB8fCAkbWRNZWRpYSgnc20nKTtcclxuICAgIH0sIGZ1bmN0aW9uKHdhbnRzRnVsbFNjcmVlbikge1xyXG4gICAgICAkc2NvcGUuY3VzdG9tRnVsbHNjcmVlbiA9ICh3YW50c0Z1bGxTY3JlZW4gPT09IHRydWUpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBEaWFsb2dDb250cm9sbGVyKCRzY29wZSwgJG1kRGlhbG9nLCBTZXNzaW9uU2VydmljZSwgJHN0YXRlKSB7XHJcbiAgJHNjb3BlLmhpZGUgPSBmdW5jdGlvbigpIHtcclxuICAgICRtZERpYWxvZy5oaWRlKCk7XHJcbiAgfTtcclxuICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24oKSB7XHJcbiAgICAkbWREaWFsb2cuY2FuY2VsKCk7XHJcbiAgfTtcclxuICAkc2NvcGUuYW5zd2VyID0gZnVuY3Rpb24oYW5zd2VyKSB7XHJcbiAgICAkbWREaWFsb2cuaGlkZShhbnN3ZXIpO1xyXG4gIH07XHJcbiAgJHNjb3BlLmxvZ2luID0gbG9naW47XHJcbiAgZnVuY3Rpb24gbG9naW4oKXtcclxuICAgIFNlc3Npb25TZXJ2aWNlLmxvZ2luKCRzY29wZS51c2VyLm5hbWUsICRzY29wZS51c2VyLnBhc3N3b3JkKTtcclxuICAgICRtZERpYWxvZy5jYW5jZWwoKTtcclxuICAgIHJldHVybiAkc3RhdGUuZ28oJ2hvbWUnKTtcclxuICB9XHJcbn1cclxuIiwidHJhdmVsQXBwLmNvbnRyb2xsZXIoJ1Byb2ZpbGVDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUpe1xyXG4gICRzY29wZS51c2VyID0ge1xyXG4gICAgbmFtZTogXCJKb2huIFJvb25leVwiLFxyXG4gICAgYWRkcmVzczogXCIyOTMgU3RyZWV0IEF2ZW51ZVwiLFxyXG4gICAgdG93bjogXCJNYW5jaGVzdGVyXCIsXHJcbiAgICBwaG9uZTogXCIrNDIgMDcyIDM1NCAyMzRcIixcclxuICAgIHdvcms6IFwiaGFja2VyXCJcclxuICB9XHJcbiAgJHNjb3BlLmdvVG9FZGl0UHJvZmlsZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjb25zb2xlLmxvZyhcIm1lcmdlP1wiKVxyXG4gICAgJHN0YXRlLmdvKCd1cGRhdGVQcm9maWxlJyk7XHJcbiAgfVxyXG59KVxyXG4iLCJ0cmF2ZWxBcHAuY29udHJvbGxlcignVXBkYXRlUHJvZmlsZUNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsIFdlYlNlcnZpY2Upe1xyXG4gIGNvbnN0IHRhZ3MgPSBbXCJzZWFzaWRlXCIsIFwic3VubnlcIiwgXCJiZWFjaFwiLCBcInNhbmRcIiwgXCJzdW1tZXJcIiwgXCJ3aW50ZXJcIiwgXCJzcHJpbmdcIiwgXCJhdXR1bW5cIiwgXCJuYXR1cmVcIiwgXCJzcG9ydHNcIiwgXCJmb29kXCIsIFwiY3VsdHVyZVwiLFxyXG4gIFwibXVzZXVtXCIsIFwibG92ZVwiLCBcImhvbGlkYXlcIixcInNub3dcIiwgXCJ0b3VyaXNtXCIsIFwiY29sZFwiLCBcImNydWlzZSBzaGlwXCIsXHJcbiAgXCJtb251bWVudHNcIiwgXCJyYWlueVwiLCBcImhvdFwiLCBcImNhcnNcIiwgXCJyZWxheFwiLCBcInJvYWR0cmlwXCIsIFwib2NlYW5cIiwgXCJpc2xhbmRcIiwgXCJ6b29cIiwgXCJ0cm9waWNhbFwiLCBcInNhZmFyaVwiLCBcInBhcmtcIiwgXCJjb3VudHJ5X3NpZGVcIixcclxuICBcImFyY2hpdGVjdHVyZVwiLCBcImxha2VcIiwgXCJyaXZlclwiLCBcInZ1bGNhbm9cIiwgXCJzd2ltbWluZ1wiLCBcInNob3BwaW5nXCIsIFwiaGlzdG9yeVwiLCBcImNsdWJiaW5nXCIsIFwibXVzaWNcIiwgXCJtb3RvcmJpa2VcIiwgXCJnYW1lc1wiLFxyXG4gIFwiZm9yZXN0XCIsIFwianVuZ2xlXCIsIFwiY2FtcGluZ1wiLCBcImx1eHVyeVwiLCBcIndhdGVyX2FjdGl2aXRpZXNcIiwgXCJjaGlsbFwiLCBcImFkdmVudHVyZVwiLCBcInJvbWFuY2VcIiwgXCJiaWN5Y2xlXCIsIFwiZmVzdGl2YWxcIixcclxuICBcInRyYWRpdGlvbnMsY2l0eV9icmVha1wiLCBcImV1cm9wZVwiLCBcImFzaWFcIiwgXCJhZnJpY2FcIiwgXCJub3J0aF9hbWVyaWNhXCIsIFwic291dGhfYW1lcmljYVwiLCBcIm9jZWFuaWFcIiwgXCJtb3VudGFpbnNcIiwgXCJjaHVyY2hcIixcclxuICBcImRyaW5rc1wiLCBcImF1cm9yYV9ib3JlYWxpc1wiLCBcImNvZmZlZVwiLCBcInRoZW1lX3BhcmtcIiwgXCJtb25hcmNoeVwiLCBcInNjaWVuY2VcIiwgXCJidXNzaW5lc1wiLCBcImNhc2lub1wiLCBcIm15dGhvbG9neVwiLCBcIndpbGRcIl07XHJcbiAgbGV0IHRhZ3NPYmplY3RzID0gW107XHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKXtcclxuICAgIHRhZ3NPYmplY3RzLnB1c2goe1xyXG4gICAgICBpZDogaSsxLFxyXG4gICAgICBuYW1lOiB0YWdzW2ldLFxyXG4gICAgICBjaGVjazogZmFsc2VcclxuICAgIH0pXHJcbiAgfVxyXG4gIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGFnc09iamVjdHMpKTtcclxuXHJcbiAgZnVuY3Rpb24gZ2V0VGFnQnlJZChpZCl7XHJcbiAgICByZXR1cm4gdGFnc09iamVjdHNbdGFnc09iamVjdHMubWFwKGZ1bmN0aW9uKHgpIHtyZXR1cm4geC5pZDsgfSkuaW5kZXhPZihpZCldO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2V0VGFnQnlOYW1lKG5hbWUpe1xyXG4gICAgcmV0dXJuIHRhZ3NPYmplY3RzW3RhZ3NPYmplY3RzLm1hcChmdW5jdGlvbih4KSB7cmV0dXJuIHgubmFtZTsgfSkuaW5kZXhPZihuYW1lKV07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjaGVja1RhZ3ModGFnc0xpc3Qpe1xyXG4gICAgZm9yIChsZXQgdGFnU3RyaW5nIG9mIHRhZ3NMaXN0KXtcclxuICAgICAgY29uc3QgdGFnID0gZ2V0VGFnQnlOYW1lKHRhZ1N0cmluZyk7XHJcbiAgICAgIHRhZy5jaGVjayA9IHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBzdWJtaXQoKXtcclxuICAgIGxldCBxdWVzdGlvbnNMaXN0ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IHF1ZXN0aW9uIG9mICRzY29wZS5xdWVzdGlvbnMpe1xyXG4gICAgICBsZXQgYW5zd2Vyc0xpc3QgPSBbXTtcclxuICAgICAgZm9yIChjb25zdCBhbnN3ZXIgb2YgcXVlc3Rpb24uYW5zd2Vycyl7XHJcbiAgICAgICAgaWYgKGFuc3dlci5jaGVjayl7XHJcbiAgICAgICAgICBhbnN3ZXJzTGlzdC5wdXNoKGFuc3dlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHF1ZXN0aW9uc0xpc3QucHVzaCh7XHJcbiAgICAgICAgaWQ6IHF1ZXN0aW9uLmlkLFxyXG4gICAgICAgIGFuc3dlcnM6IGFuc3dlcnNMaXN0XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2cocXVlc3Rpb25zTGlzdCk7XHJcbiAgICBjb25zb2xlLmxvZygkc2NvcGUuZGF0YS5hZ2UpXHJcbiAgICBjb25zb2xlLmxvZygkc2NvcGUuZGF0YS5nZW5kZXIpXHJcblxyXG4gICAgV2ViU2VydmljZS5wb3N0KFwiL3VzZXIvZGF0YVwiLHtcclxuICAgICAgYWdlOiAkc2NvcGUuZGF0YS5hZ2UsXHJcbiAgICAgIGdlbmRlcjogJHNjb3BlLmRhdGEuZ2VuZGVyLFxyXG4gICAgICBxdWVzdGlvbnM6IHF1ZXN0aW9uc0xpc3RcclxuICAgIH0pXHJcbiAgICAudGhlbihmdW5jdGlvbigpe1xyXG4gICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XHJcbiAgICB9KVxyXG5cclxuXHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGluaXRRdWVzdGlvbnMoKXtcclxuXHJcbiAgICAkc2NvcGUucXVlc3Rpb25zRnJvbVNlcnZlciA9IFt7XHJcbiAgICAgIGlkOiAxLFxyXG4gICAgICBhbnN3ZXJzOiBbe1xyXG4gICAgICAgIGlkOiAxXHJcbiAgICAgIH0seyBpZDogMn1dXHJcbiAgICB9XVxyXG5cclxuXHJcbiAgICBmb3IgKGNvbnN0IHF1ZXN0aW9uIG9mICRzY29wZS5xdWVzdGlvbnMpe1xyXG4gICAgICBsZXQgYW5zd2Vyc0xpc3QgPSBnZXRBbnN3ZXJGb3JRdWVzdGlvbigkc2NvcGUucXVlc3Rpb25zRnJvbVNlcnZlciwgcXVlc3Rpb24uaWQpXHJcbiAgICAgIGZvciAoY29uc3QgYW5zd2VyIG9mIHF1ZXN0aW9uLmFuc3dlcnMpe1xyXG4gICAgICAgIGlmIChhbnN3ZXJzTGlzdC5pbmRleE9mKGFuc3dlci5pZC0xKSE9PSAtMSl7XHJcbiAgICAgICAgICBhbnN3ZXIuY2hlY2sgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhbnN3ZXIuY2hlY2sgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldEFuc3dlckZvclF1ZXN0aW9uKHF1ZXN0aW9uc0Zyb21TZXJ2ZXIsIGlkKXtcclxuICAgIGxldCBhbnN3ZXJzQ2hlY2tlZCA9IFtdO1xyXG4gICAgaWYgKCFxdWVzdGlvbnNGcm9tU2VydmVyW2lkLTFdKXtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgICBmb3IgKGNvbnN0IGFuc3dlciBvZiBxdWVzdGlvbnNGcm9tU2VydmVyW2lkLTFdLmFuc3dlcnMpe1xyXG4gICAgICAgICAgYW5zd2Vyc0NoZWNrZWQucHVzaChhbnN3ZXIuaWQpO1xyXG4gICAgICB9XHJcbiAgICByZXR1cm4gYW5zd2Vyc0NoZWNrZWQ7XHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIGZ1bmN0aW9uIG1haW4oKXtcclxuICAgIGluaXRTY29wZSgpO1xyXG4gIH1cclxuXHJcblxyXG5cclxuICBjb25zdCBxdWVzdGlvbnMgPSBbXHJcbiAgICB7XHJcbiAgICAgIGlkOiAxLFxyXG4gICAgICB0ZXh0OlwiMy4gV2hhdCBraW5kIG9mIGhvbGlkYXkgYXJlIHlvdSBsb29raW5nIGZvcjpcIixcclxuICAgICAgYWR2aWNlOiBcIkp1c3QgYmUgaG9uZXN0XCIsXHJcbiAgICAgIGFuc3dlcnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogMSxcclxuICAgICAgICAgIHRleHQ6IFwiQ2l0eSBicmVha1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogMixcclxuICAgICAgICAgIHRleHQ6IFwiQ3VsdHVyYWxcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgICB0ZXh0OiBcIkZhbWlseVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogNCxcclxuICAgICAgICAgIHRleHQ6IFwiQ3J1aXNlIFNoaXBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDUsXHJcbiAgICAgICAgICB0ZXh0OiBcIlJvbWFudGljXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiA2LFxyXG4gICAgICAgICAgdGV4dDogXCJQYXJ0eVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDcsXHJcbiAgICAgICAgICB0ZXh0OiBcIkx1eHVyeVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogOCxcclxuICAgICAgICAgIHRleHQ6IFwiUGlsZ3JpbWFnZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBpZDogMixcclxuICAgICAgdGV4dDpcIjQuIFdoYXQgdGltZSBvZiB0aGUgeWVhciB3b3VsZCB5b3UgbGlrZSB0byB0cmF2ZWw/XCIsXHJcbiAgICAgIGFkdmljZTogXCJKdXN0IGJlIGhvbmVzdFwiLFxyXG4gICAgICBhbnN3ZXJzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgICB0ZXh0OiBcIlNwcmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogMixcclxuICAgICAgICAgIHRleHQ6IFwiU3VtbWVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAzLFxyXG4gICAgICAgICAgdGV4dDogXCJBdXR1bW5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDQsXHJcbiAgICAgICAgICB0ZXh0OiBcIldpbnRlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogNSxcclxuICAgICAgICAgIHRleHQ6IFwiSG9saWRheXNcIlxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgaWQ6IDMsXHJcbiAgICAgIHRleHQ6XCI1LiBQcmljZSBSYW5nZTpcIixcclxuICAgICAgYWR2aWNlOiBcIkp1c3QgYmUgaG9uZXN0XCIsXHJcbiAgICAgIGFuc3dlcnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogMSxcclxuICAgICAgICAgIHRleHQ6IFwiPDIwMCBFXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgdGV4dDogXCIyMDAtNTAwIEVcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgICB0ZXh0OiBcIjUwMC0xMDAwIEVcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDQsXHJcbiAgICAgICAgICB0ZXh0OiBcIj4xMDAwXCJcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiA0LFxyXG4gICAgICB0ZXh0OlwiNi4gSG93IHdvdWxkIHlvdSBzcGVuZCB5b3VyIGRheXRpbWUgaW4geW91ciBwZXJmZWN0IGhvbGlkYXkgZGVzdGluYXRpb24/XCIsXHJcbiAgICAgIGFkdmljZTogXCJKdXN0IGJlIGhvbmVzdFwiLFxyXG4gICAgICBhbnN3ZXJzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgICB0ZXh0OiBcIlNob3BwaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgdGV4dDogXCJPbiB0aGUgYmVhY2hcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgICB0ZXh0OiBcIkFkdmVudHVyZVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogNCxcclxuICAgICAgICAgIHRleHQ6IFwiVGhlbWUgUGFya1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogNSxcclxuICAgICAgICAgIHRleHQ6IFwiQ2x1YmJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDUsXHJcbiAgICAgICAgICB0ZXh0OiBcIlZpc2l0aW5nIGF0dHJhY3Rpb25zXCJcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiA1LFxyXG4gICAgICB0ZXh0OlwiNy4gSW50ZXJlc3RzOlwiLFxyXG4gICAgICBhZHZpY2U6IFwiSnVzdCBiZSBob25lc3RcIixcclxuICAgICAgYW5zd2VyczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAxLFxyXG4gICAgICAgICAgdGV4dDogXCJIaXN0b3J5XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAyLFxyXG4gICAgICAgICAgdGV4dDogXCJTcG9ydHNcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgICB0ZXh0OiBcIk11c2ljXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiA0LFxyXG4gICAgICAgICAgdGV4dDogXCJTY2llbmNlXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiA1LFxyXG4gICAgICAgICAgdGV4dDogXCJGb29kXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiA1LFxyXG4gICAgICAgICAgdGV4dDogXCJBcmNoaXRlY3R1cmVcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDYsXHJcbiAgICAgICAgICB0ZXh0OiBcIlJlbGlnaW9uXCJcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiA1LFxyXG4gICAgICB0ZXh0OlwiOC5XaGF0IHZpZXdzIGFyZSBiZXN0IGZvciB5b3U/XCIsXHJcbiAgICAgIGFkdmljZTogXCJKdXN0IGJlIGhvbmVzdFwiLFxyXG4gICAgICBhbnN3ZXJzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgICB0ZXh0OiBcIlBhbm9yYW1pYyBTZWEgVmlld3NcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgICB0ZXh0OiBcIlBhbm9yYW1pYyBNb3VudGFpbnMgVmlld1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogMyxcclxuICAgICAgICAgIHRleHQ6IFwiQ291bnRyeXNpZGVcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDQsXHJcbiAgICAgICAgICB0ZXh0OiBcIkRlc2VydCBhbmQgc2FuZFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogNSxcclxuICAgICAgICAgIHRleHQ6IFwiQW5pbWFscywgdHJhZGl0aW9uLCBkYW5jaW5nIGFuZCBzaW5naW5nXCJcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiA1LFxyXG4gICAgICB0ZXh0OlwiOS5XaGVyZSB3b3VsZCB5b3UgbGlrZSB0byBzdGF5P1wiLFxyXG4gICAgICBhZHZpY2U6IFwiSnVzdCBiZSBob25lc3RcIixcclxuICAgICAgYW5zd2VyczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAxLFxyXG4gICAgICAgICAgdGV4dDogXCJJbiBhIFNlbWktSnVuZ2xlIEFjY29tYWRhdGlvblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogMixcclxuICAgICAgICAgIHRleHQ6IFwiSW4gYSBIb2xpZGF5IFZpbGxhZ2VcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgICB0ZXh0OiBcIkluIGEgQmVhY2ggSG90ZWxcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDQsXHJcbiAgICAgICAgICB0ZXh0OiBcIkluIGEgNSBzdGFyIGhvdGVsXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiA1LFxyXG4gICAgICAgICAgdGV4dDogXCJDYW1waW5nXCJcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiA1LFxyXG4gICAgICB0ZXh0OlwiMTAuV291bGQgeW91IHJhdGhlcjpcIixcclxuICAgICAgYWR2aWNlOiBcIkp1c3QgYmUgaG9uZXN0XCIsXHJcbiAgICAgIGFuc3dlcnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogMSxcclxuICAgICAgICAgIHRleHQ6IFwiVmlzaXQgYSBNaWNoZWxpbi1zdGFycmVkIHJlc3RhdXJhbnRcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgICB0ZXh0OiBcIlNlZSBtb25rZXlzIHN3aW5naW5nIGluIHRoZSB0cmVlc1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogMyxcclxuICAgICAgICAgIHRleHQ6IFwiVGFrZSBpbiBzcGVjdGFjdWxhciB2aWV3cyBhbmQgbGFuZHNjYXBlc1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogNCxcclxuICAgICAgICAgIHRleHQ6IFwiVmlzaXQgYW4gYW5jaWVudCBjaXR5XCJcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH1cclxuXHJcbiAgXTtcclxuXHJcblxyXG5cclxuICBmdW5jdGlvbiBpbml0U2NvcGUoKXtcclxuICAgICRzY29wZS5jaGVja1RhZ3MgPSBjaGVja1RhZ3M7XHJcbiAgICAkc2NvcGUuc3VibWl0ID0gc3VibWl0O1xyXG4gICAgJHNjb3BlLnF1ZXN0aW9ucyA9IHF1ZXN0aW9ucztcclxuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KCRzY29wZS5xdWVzdGlvbnMpKTtcclxuICAgIGluaXRRdWVzdGlvbnMoKTtcclxuICB9XHJcbiAgbWFpbigpO1xyXG59KTtcclxuIiwidHJhdmVsQXBwLmRpcmVjdGl2ZShcInRyYXZlbEF1dG9jb21wbGV0ZVwiLCBmdW5jdGlvbigpe1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgbmV3VGFnczogXCI9XCJcclxuICAgIH0sXHJcbiAgICBjb250cm9sbGVyOiAnVHJhdmVsQXV0b2NvbXBsZXRlQ29udHJvbGxlcicsXHJcbiAgICB0ZW1wbGF0ZVVybDogJ3ByZXNlbnRhdGlvbi9jb21wb25lbnRzL2F1dG9jb21wbGV0ZS90cmF2ZWxBdXRvY29tcGxldGUuaHRtbCdcclxuICB9XHJcbn0pXHJcbiIsInRyYXZlbEFwcC5kaXJlY3RpdmUoJ3RyYXZlbEhlYWRlcicsIGZ1bmN0aW9uKCl7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICBzY29wZToge30sXHJcbiAgICBjb250cm9sbGVyOiAnVHJhdmVsSGVhZGVyQ29udHJvbGxlcicsXHJcbiAgICB0ZW1wbGF0ZVVybDogJ3ByZXNlbnRhdGlvbi9jb21wb25lbnRzL2hlYWRlci90cmF2ZWxIZWFkZXIuaHRtbCdcclxuICB9XHJcbn0pXHJcbiIsInRyYXZlbEFwcC5kaXJlY3RpdmUoXCJsb2FkaW5nUGxhbmVcIiwgZnVuY3Rpb24oKXtcclxuICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ByZXNlbnRhdGlvbi9jb21wb25lbnRzL2xvYWRpbmdQbGFuZS9sb2FkaW5nUGxhbmUuaHRtbCdcclxuICB9XHJcbn0pXHJcbiIsInRyYXZlbEFwcC5mYWN0b3J5KCdTZXNzaW9uU2VydmljZScsIGZ1bmN0aW9uKCl7XHJcblxyXG4gIGZ1bmN0aW9uIHNldERhdGEoa2V5LCB2YWx1ZSl7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGtleSx2YWx1ZSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXREYXRhKGtleSl7XHJcbiAgICByZXR1cm4gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShrZXkpXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpc0xvZ2dlZEluKCl7XHJcbiAgICByZXR1cm4gIGdldERhdGEoJ3VzZXJuYW1lVHJhdmVsQXBwJykgIT09IHVuZGVmaW5lZCAmJiBnZXREYXRhKCd1c2VybmFtZVRyYXZlbEFwcCcpICE9PSAnbnVsbCc7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBsb2dpbih1c2VyLCBwYXNzd29yZCl7XHJcbiAgICBzZXREYXRhKCd1c2VybmFtZVRyYXZlbEFwcCcsdXNlcik7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBsb2dvdXQoKXtcclxuICAgIHNldERhdGEoJ3VzZXJuYW1lVHJhdmVsQXBwJywgJ251bGwnKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFVzZXJOYW1lKCl7XHJcbiAgICByZXR1cm4gZ2V0RGF0YSgndXNlcm5hbWVUcmF2ZWxBcHAnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBsb2dpbixcclxuICAgIGlzTG9nZ2VkSW4sXHJcbiAgICBsb2dvdXQsXHJcbiAgICBnZXRVc2VyTmFtZVxyXG4gIH1cclxufSlcclxuIiwidHJhdmVsQXBwLmZhY3RvcnkoJ1dlYlNlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHEpe1xyXG5cclxuICBmdW5jdGlvbiBnZXQodXJsKXtcclxuICAgIGNvbnN0IGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICAgICRodHRwKHtcclxuICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgdXJsOiB1cmwsXHJcbiAgICAgIGhlYWRlcnM6e1xyXG4gICAgICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcclxuICAgICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCwgUE9TVCwgUFVULCBERUxFVEUsIE9QVElPTlMnLFxyXG4gICAgICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnQ29udGVudC1UeXBlLCBYLVJlcXVlc3RlZC1XaXRoJyxcclxuICAgICAgICAgICAgICAgICdYLVJhbmRvbS1TaGl0JzonMTIzMTIzMTIzJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgICAuc3VjY2VzcyhidWlsZFN1Y2Nlc3NIYW5kbGVyKGRlZmVycmVkKSlcclxuICAgICAgLmVycm9yKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGRlZmVycmVkLnJlamVjdChkYXRhKTtcclxuICAgICAgfSk7XHJcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHBvc3QodXJsLCBkYXRhKXtcclxuICAgIGNvbnN0IGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICAgICRodHRwKHtcclxuICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgIHVybDogdXJsLFxyXG4gICAgICBoZWFkZXJzOntcclxuICAgICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXHJcbiAgICAgICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJyxcclxuICAgICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSwgWC1SZXF1ZXN0ZWQtV2l0aCcsXHJcbiAgICAgICAgICAgICAgICAnWC1SYW5kb20tU2hpdCc6JzEyMzEyMzEyMydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgZGF0YTogZGF0YVxyXG4gICAgfSlcclxuICAgICAgLnN1Y2Nlc3MoYnVpbGRTdWNjZXNzSGFuZGxlcihkZWZlcnJlZCkpXHJcbiAgICAgIC5lcnJvcihmdW5jdGlvbihlcnJvckRhdGEpe1xyXG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvckRhdGEpO1xyXG4gICAgICB9KTtcclxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYnVpbGRTdWNjZXNzSGFuZGxlcihkZWZlcnJlZCl7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICBpZiAoZGVmZXJyZWQuY2FuY2VsbGVkKXtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgZGVmZXJyZWQucmVzb2x2ZShkYXRhKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBnZXQsXHJcbiAgICBwb3N0XHJcbiAgfVxyXG59KVxyXG4iLCJ0cmF2ZWxBcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpe1JvdXRpbmdCdWlsZGVyKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpLmJ1aWxkU3RhdGVzKFt7XCJuYW1lXCI6XCJjcmVhdGVQcm9maWxlXCIsXCJ1cmxcIjpcIi9jcmVhdGVQcm9maWxlXCJ9LHtcIm5hbWVcIjpcImhvbWVcIixcInVybFwiOlwiL2hvbWVcIn0se1wibmFtZVwiOlwibG9naW5cIixcInVybFwiOlwiL2xvZ2luXCJ9LHtcIm5hbWVcIjpcInByb2ZpbGVcIixcInVybFwiOlwiL3Byb2ZpbGVcIn0se1wibmFtZVwiOlwidXBkYXRlUHJvZmlsZVwiLFwidXJsXCI6XCIvdXBkYXRlUHJvZmlsZVwifV0pO30pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
