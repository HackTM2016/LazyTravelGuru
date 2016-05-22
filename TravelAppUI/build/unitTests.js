var gulp = require('gulp');
var karma = require('karma');
var path = require('path');

function unitTests(karmaAction, browser, done, coverage) {
  new karma.Server(createKarmaConfig(karmaAction, browser, coverage), done).start();
}

function createKarmaConfig(karmaAction, browser, coverage){
  var config = {
    configFile: path.join(__dirname, '../test/unit/karma.' + browser + '.conf.js'),
    singleRun: karmaAction === 'run',
    preprocessors: {
      'target/www/presentation/components/**/*.html': 'ng-html2js'
    },
    ngHtml2JsPreprocessor: {
      cacheIdFromPath : function(filepath) {
        return filepath.substr(filepath.indexOf("appname")+8);
      },
      stripPrefix: 'target/www/',
      moduleName: 'vofapl.templateURLs2JS'
    }
  };

  if(coverage){
    config.reporters = ['coverage'];

    config.preprocessors['target/www/js/app.*.js'] = ['coverage'];

    config.coverageReporter = {
      type: 'html',
      dir: 'target/coverage'
    };
  }

  return config;
}

module.exports = {

  unitTests: unitTests

};