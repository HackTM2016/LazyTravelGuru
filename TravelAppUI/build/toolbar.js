var camelcase = require('camelcase');
var decamelize = require('decamelize');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');

function generateLess(){
    return through.obj(buildToolbarFileGenerator(getGeneratedLessFilePath, renderLessFile));
}

function buildToolbarMetadata(toolbarJsonFilePath){
    var parsedPath = path.parse(toolbarJsonFilePath);
    var toolbarName = path.parse(parsedPath.dir).base;

    return {
        dir: parsedPath.dir,
        nameCC: toolbarName,
        nameDC: decamelize(toolbarName, '-'),
    };
}

function getGeneratedLessFilePath(toolbarMetadata){
    return path.join(toolbarMetadata.dir, toolbarMetadata.nameCC + '.less');
}

function parseToolbarConfig(file){
    return JSON.parse(file.contents);
}

function renderLessFile(toolbarMetadata, toolbarConfig){
    var out = '';

    out += '.vfp-' + toolbarMetadata.nameDC + '{\n';
    out += renderAllButtonsLessRules(toolbarMetadata, toolbarConfig) + '\n';
    for(var i = 0; i < toolbarConfig.length; ++i){
        var buttonConfig = toolbarConfig[i];
        if(buttonConfig.disabled){
            continue;
        }

        out += renderButtonOffsetRule(toolbarMetadata, buttonConfig, i) + '\n';
    }
    out += '}\n';

    return out;
}

function renderAllButtonsLessRules(toolbarMetadata, toolbarConfig){
    var out = '';

    var firstSelector = true;
    for(var i = 0; i < toolbarConfig.length; ++i){
        var toolbarButton = toolbarConfig[i];

        if(toolbarButton.disabled){
            continue;
        }

        if(firstSelector){
            firstSelector = false;
        }
        else{
            out += ', ';
        }

        out += '.' + buildButtonClassName(toolbarButton);
    }

    out += '{';
    out += 'width: @vfp-' + toolbarMetadata.nameDC + '-icon-width + 2px;';
    out += 'height: @vfp-' + toolbarMetadata.nameDC + '-icon-height + 2px;';
    out += 'background-image: url("../' + toWebPath(toolbarMetadata.dir) + '/' + toolbarMetadata.nameCC + 'Icons.png");';
    out += '}';

    return out;
}

function renderButtonOffsetRule(toolbarMetadata, buttonConfig, buttonIndex){
    var out = '';

    out += '.' + buildButtonClassName(buttonConfig);
    out += '{';
    out += 'background-position: 0 ' + (-buttonIndex) + '*@vfp-' + toolbarMetadata.nameDC + '-icon-height;';
    out += '}';

    out += '.' + buildButtonClassName(buttonConfig) + ':disabled';
    out += '{';
    out += 'background-position: -1*@vfp-' + toolbarMetadata.nameDC + '-icon-width ' + (-buttonIndex) + '*@vfp-' + toolbarMetadata.nameDC + '-icon-height;';
    out += '}';

    return out;
}

function generateHtml(){
    return through.obj(buildToolbarFileGenerator(getGeneratedHtmlFilePath, renderHtmlFile));
}

function getGeneratedHtmlFilePath(toolbarMetadata){
    return path.join(toolbarMetadata.dir, toolbarMetadata.nameCC + '.html');
}

function renderHtmlFile(toolbarMetadata, toolbarConfig){
    var out = '';

    out += '<div class="vfp-' + toolbarMetadata.nameDC + '">\n';

    var sortedToolbarButtons = toolbarConfig.slice().sort(function(left, right){
        return left.sortOrdinal - right.sortOrdinal;
    });

    var lastButtonGroup = null;
    var firstButton = true;
    for(var i = 0; i < sortedToolbarButtons.length; ++i){
        var buttonConfig = sortedToolbarButtons[i];
        if(buttonConfig.disabled){
            continue;
        }

        if(firstButton){
            firstButton = false;
        }
        else{
            if(lastButtonGroup !== buttonConfig.group){
                out += renderGroupHtml();
            }
        }

        out += renderButtonHtml(toolbarMetadata, buttonConfig) + '\n';
        lastButtonGroup = buttonConfig.group;
    }

    out += '</div>\n';

    return out;
}

function renderButtonHtml(toolbarMetadata, buttonConfig){
    var out = '';

    out += '<button';
    out += ' class="' + buildButtonClassName(buttonConfig) + '"';
    out += ' ng-disabled="' + camelcase(buttonConfig.id) + 'Loading || (' + buildClickPossibleFunctionName(buttonConfig) + ' && !' + buildClickPossibleFunctionName(buttonConfig) + '())"';
    out += ' ng-click="' + buildClickFunctionName(buttonConfig) + '()"';
    out += ' title="{{::\'' + toolbarMetadata.nameCC + '.' + camelcase(buttonConfig.id) + '\' | translate}}"';
    out += '></button>';

    return out;
}

function renderGroupHtml(){
    return ' | ';
}

function generateController(){
    return through.obj(buildToolbarFileGenerator(getGeneratedControllerFilePath, renderControllerFile));
}

function getGeneratedControllerFilePath(toolbarMetadata){
    return path.join(toolbarMetadata.dir, buildControllerName(toolbarMetadata) + '.js');
}

function renderControllerFile(toolbarMetadata, toolbarConfig){
    return 'vofapl.controller(\'' + buildControllerName(toolbarMetadata) + '\', function($scope, LoadingWrapperFactory){LoadingWrapperFactory.buildLoadingWrappers($scope);});\n';
}

function generateDirective(){
    return through.obj(buildToolbarFileGenerator(getGeneratedDirectiveFilePath, renderDirectiveFile));
}

function getGeneratedDirectiveFilePath(toolbarMetadata){
    return path.join(toolbarMetadata.dir, toolbarMetadata.nameCC + 'Directive.js');
}

function renderDirectiveFile(toolbarMetadata, toolbarConfig){
    var out = '';

    out += 'vofapl.directive(\'vfp' + toFirstUpper(toolbarMetadata.nameCC) + '\', function () {\n';

    out += 'return {';
    out += 'restrict: \'E\',';
    out += 'templateUrl: \'' + toWebPath(toolbarMetadata.dir) + '/' + toolbarMetadata.nameCC + '.html\',';
    out += 'controller: \'' + buildControllerName(toolbarMetadata) + '\',';

    out += 'scope: {';
    for(var i = 0; i < toolbarConfig.length; ++i){
        var buttonConfig = toolbarConfig[i];

        if(buttonConfig.disabled){
            continue;
        }

        out += '\'' + camelcase(buttonConfig.id) + '\': \'=\',';
        out += '\'' + buildClickPossibleFunctionName(buttonConfig) + '\': \'=\',';
    }
    out += '}';

    out += '};';

    out += '});\n';

    return out;
}

function buildToolbarFileGenerator(filePathBuilder, fileContentRenderer){
    return function(toolbarConfigFile, enc, cb){
        var toolbarMetadata = buildToolbarMetadata(toolbarConfigFile.relative);
        var toolbarConfig = parseToolbarConfig(toolbarConfigFile);

        var lessFile = new gutil.File();
        lessFile.path = filePathBuilder(toolbarMetadata);
        lessFile.contents = new Buffer(fileContentRenderer(toolbarMetadata, toolbarConfig));

        this.push(lessFile);

        cb();
    }
}

function buildControllerName(toolbarMetadata){
    return toFirstUpper(toolbarMetadata.nameCC) + 'Controller';
}

function buildButtonClassName(buttonConfig){
    return 'vfp-' + decamelize(buttonConfig.id, '-') + '-button';
}

function buildClickPossibleFunctionName(buttonConfig){
    return 'is' + toFirstUpper(camelcase(buttonConfig.id)) + 'Possible';
}

function buildClickFunctionName(buttonConfig){
    return '_' + camelcase(buttonConfig.id);
}

function toWebPath(somePath){
    return somePath.split(path.sep).join('/');
}

function toFirstUpper(s){
    return s.substring(0, 1).toUpperCase() + s.substring(1);
}

module.exports = {
    generateLess: generateLess,
    generateHtml: generateHtml,
    generateController: generateController,
    generateDirective: generateDirective,
};