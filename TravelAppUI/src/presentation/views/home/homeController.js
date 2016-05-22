travelApp.controller('HomeController', function($scope,$mdDialog, $mdMedia, WebService){
	function main(){
		initScope();
		getData();
	}

	function initScope(){
		$scope.data = {
			flights: []
		};
		$scope.showDetails = showDetails;
		$scope.flightsLoading = false;
		$scope.somethingWrong = false;
		$scope.pageLoading = true;
		$scope.submitNewTags = submitNewTags;
	}

	function getData(){
		$scope.somethingWrong = false;
		$scope.flightsLoading = true;
		WebService.get('/flights/fs/flight/all')
			.then(function(response){
				$scope.data.flights = response;

			})
			.catch(function(error){
				console.log(error);
				$scope.somethingWrong = true;
			})
			.finally(function(){
				$scope.flightsLoading = false;
				$scope.pageLoading = false;
			});
	}

	function submitNewTags(){
		console.log($scope.newTags);
		getData();
	}

	function showDetails(ev, row){
		var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
		$mdDialog.show({
			controller: DialogController,
			templateUrl: 'presentation/components/dialogs/detailsDialog.html',
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

	}

	main();
})

function DialogController($scope, $mdDialog) {
  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
    $mdDialog.hide(answer);
  };



}
