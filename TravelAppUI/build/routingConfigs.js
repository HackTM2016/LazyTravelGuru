/*
 * This file contains a gulp task to generate states for angular ui
 * route.
 */

var fs = require('q-io/fs');
var merge = require('merge');
var path = require('path');
var q = require('q');

function collectRoutingConfigs(viewsPath){
  return findViewDirectories(viewsPath)
    .then(function(viewDirPaths){
      var promises = [];

      for(var i = 0; i < viewDirPaths.length; ++i){
        promises.push(buildRoutingConfig(viewDirPaths[i]));
      }

      return q.all(promises);
    })
    .then(function(routingConfigs){
      return routingConfigs.filter(function(routingConfig){
        return routingConfig !== null;
      });
    });
}

function buildRoutingConfig(viewDirPath){
  var routingConfigPath = path.join(viewDirPath, 'routing.json');
  var viewName = path.basename(viewDirPath);
  var routingConfig = generateDefaultRoutingConfig(viewName);

  return fs.exists(routingConfigPath)
    .then(function(routingConfigPathExists){
      if(!routingConfigPathExists){
        return null;
      }

      return fs.read(routingConfigPath);
    })
    .then(function(routingConfigFileContent){
      if(routingConfigFileContent){
        var customRoutingConfig = JSON.parse(routingConfigFileContent);

        if(customRoutingConfig.disableGenerateRouting){
          return null;
        }

        return merge.recursive(true, routingConfig, customRoutingConfig);
      }

      return routingConfig;
    });
}

function generateDefaultRoutingConfig(viewName){
  return {
    name: viewName,
    url: '/' + viewName,
  };
}

function findViewDirectories(viewsPath){
  var viewsPaths = [];

  return fs.list(viewsPath)
    .then(function(viewsPathItems){
      var promises = [];

      for(var i = 0; i < viewsPathItems.length; ++i){
        var viewPath = path.join(viewsPath, viewsPathItems[i]);

        viewsPaths.push(viewPath);
        promises.push(fs.isDirectory(viewPath));
      }

      return q.all(promises);
    })
    .then(function(viewPathIsDir){
      var viewDirectories = [];

      for(var i = 0; i < viewsPaths.length; ++i){
        if(!viewPathIsDir[i]){
          continue;
        }

        var viewPath = viewsPaths[i];

        viewDirectories.push(viewPath);
      }

      return viewDirectories;
    });
}

function renderRoutingAngularConfigToFile(configPath, routingConfigs){
  var configDirPath = path.dirname(configPath);

  return fs.makeTree(configDirPath)
    .then(function(){
      return fs.write(configPath, new Buffer(renderRoutingAngularConfig(routingConfigs)));
    });
}

function renderRoutingAngularConfig(routingConfigs){
  var content = '';

  content += 'travelApp.config(function($stateProvider, $urlRouterProvider){';

  content += 'RoutingBuilder($stateProvider, $urlRouterProvider).buildStates(';
  content += JSON.stringify(routingConfigs);
  content += ');';

  content += '});';

  return content;
}

module.exports = {

  collectRoutingConfigs: collectRoutingConfigs,

  renderRoutingAngularConfig: renderRoutingAngularConfigToFile

};
