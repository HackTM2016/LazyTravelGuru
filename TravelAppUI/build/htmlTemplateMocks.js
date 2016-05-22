var eventStream = require('event-stream');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');

function collect(filePath){
    var allTemplates = {};

    function collectTemplates(file, enc, cb){
        var templateId = extractTemplateIdFromFilePath(file.path);
        allTemplates[templateId] = file.contents.toString(enc);
        cb();
    }

    function extractTemplateIdFromFilePath(filePath){
        var pathElements = filePath.split(path.sep);

        var templateId = '';
        for(var i = pathElements.lastIndexOf('presentation') + 1; i < pathElements.length - 1; ++i){
            if(templateId.length > 0){
                templateId += '/';
            }
            templateId += pathElements[i];
        }

        var parsedFilePath = path.parse(filePath);

        if(templateId.length > 0){
            templateId += '/';
        }
        templateId += parsedFilePath.name;

        return templateId;
    }

    function flushCollectedTemplates(cb){
        var combinedFile = new gutil.File();
        combinedFile.path = filePath;
        combinedFile.contents = new Buffer(JSON.stringify(allTemplates));

        this.push(combinedFile);
        cb();
    }

    return through.obj(collectTemplates, flushCollectedTemplates);
}

function buildDefinition(){
    function transform(file, cb){
        var templates = JSON.parse(file.contents);

        file.contents = new Buffer(renderSetTemplateCalls(templates));

        return cb(null, file);
    }

    return eventStream.map(transform);
}

function renderSetTemplateCalls(templates){
    var out = '';

    for(var templateId in templates){
        if(!templates.hasOwnProperty(templateId)){
            continue;
        }

        var template = templates[templateId];

        out += 'vfpHtmlTemplates.setTemplate("' + templateId + '", "' + escapeTemplateString(template) + '");\n';
    }

    return out;
}

function escapeTemplateString(template){
    return template
        .replace(/(\r)?\n/g, '\\n')
        .replace(/"/g, '\\"');
}

module.exports = {
    collect: collect,
    buildDefinition: buildDefinition,
};