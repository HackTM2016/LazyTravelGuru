/*
 * angular dependency injection is not used for RoutingBuilder because
 * it's used within a vofapl.config(...) call.
 */
function RoutingBuilder($stateProvider, $urlRouterProvider){

  // the initial default state
  $urlRouterProvider.otherwise("/home");

  function buildStates(routingConfigs){
    for(var i = 0; i < routingConfigs.length; ++i){
      var routingConfig = routingConfigs[i];

      addState(routingConfig.name, routingConfig.url, routingConfig.params);
    }

    addConnectionErrorState();
  }

  function addState(name, url, params){
    url = url || '/' + name;

    var controllerName = toFirstUpper(name) + 'Controller';

    $stateProvider
      .state(name, {
        url: url,
        params: params,
        templateUrl: 'presentation/views/' + name + '/' + name + '.html',
        controller: controllerName
      });
  }

  function addConnectionErrorState(){
    $stateProvider
        .state('connectionError', {
          url: '/connectionError',
          template: '<div class="vfp-connection-error" id="contentContainer"> <div class="title" id="mainTitle">{{::\'connectionError.title\' | translate}}</div> <div class="taskSection" id="taskSection"> <ul class="tasks" id="notConnectedTasks"> <li id="task2-1">{{::\'connectionError.task.networkWire\' | translate}}</li> <li id="task2-2">{{::\'connectionError.task.airplaneMode\' | translate}}</li> <li id="task2-3">{{::\'connectionError.task.switchOnline\' | translate}}</li> <li id="task2-4">{{::\'connectionError.task.mobileConnection\' | translate}}</li> <li id="task2-5">{{::\'connectionError.task.restartRouter\' | translate}}</li> </ul> </div> </div>',
        });
  }

  function toFirstUpper(s){
    return s[0].toUpperCase() + s.substr(1);
  }

  return {

    buildStates: buildStates

  };
}
