const fs = require('q-io/fs');
const path = require('path');
const q = require('q');
const uglifyjs = require('uglify-js');

const ACCESS_SUFFIX = 'Access.js';
const ACCESS_MOCK_SUFFIX = 'AccessMock.js';

function validateAccessInterfaces(accessDirPath){
    return fs.list(accessDirPath)
        .then(function(accessDirEntries){
            var accessToMockMap = {};
            var accessMockFilePaths = [];

            for(var i = 0; i < accessDirEntries.length; ++i){
                var fileName = accessDirEntries[i];
                var filePath = path.join(accessDirPath, fileName);

                if(endsWith(fileName, ACCESS_SUFFIX)){
                    accessToMockMap[filePath] = null;
                }
                else if(endsWith(fileName, ACCESS_MOCK_SUFFIX)){
                    accessMockFilePaths.push(filePath);
                }
            }

            for(var i = 0; i < accessMockFilePaths.length; ++i){
                var accessMockFilePath = accessMockFilePaths[i];
                var accessPath = accessMockToAccessPath(accessMockFilePath);

                if(accessToMockMap.hasOwnProperty(accessPath)){
                    accessToMockMap[accessPath] = accessMockFilePath;
                }
            }

            return mapToArray(accessToMockMap)
                .filter(function(accessToMockEntry){
                    var accessMockPath = accessToMockEntry[1];

                    return accessMockPath !== null;
                })
                .reduce(function(formerPromise, accessToMockEntry){
                    var accessPath = accessToMockEntry[0];
                    var accessMockPath = accessToMockEntry[1];

                    return formerPromise
                        .then(function(){
                            return ensureMatchingInterface(accessPath, accessMockPath);
                        });
                }, q.when());
        });
}

function accessMockToAccessPath(accessMockPath){
    var parsedPath = path.parse(accessMockPath);

    return path.join(parsedPath.dir, parsedPath.base.replace('Mock', ''));
}

function mapToArray(map){
    var a = [];

    for(var key in map){
        if(map.hasOwnProperty(key)){
            var value = map[key];

            a.push([key, value]);
        }
    }

    return a;
}

function endsWith(s, suffix){
    return s.indexOf(suffix, s.length - suffix.length) !== -1;
}

function ensureMatchingInterface(accessPath, accessMockPath){
    return q.all([
        parseJavaScriptAst(accessPath),
        parseJavaScriptAst(accessMockPath),
    ])
        .then(function(args){
            var accessAst = args[0];
            var accessMockAst = args[1];

            var accessProperties = getLastReturnPropertiesFromAst(accessAst);
            var accessMockProperties = getLastReturnPropertiesFromAst(accessMockAst);

            ensurePropertiesMatch(accessProperties, accessMockProperties);
        });

    function ensurePropertiesMatch(accessProperties, accessMockProperties){
        for(var i = 0; i < accessProperties.length; ++i){
            var accessProperty = accessProperties[i];

            if(accessMockProperties.indexOf(accessProperty) === -1){
                throw new Error('Missing function ' + accessProperty + ' in access mock ' + path.basename(accessMockPath));
            }
        }
    }

}

function parseJavaScriptAst(javaScriptPath){
    return fs.read(javaScriptPath)
        .then(function(javaScriptCode){
            return uglifyjs.parse(javaScriptCode, {
                filename: javaScriptPath,
            });
        });
}

function getLastReturnPropertiesFromAst(ast){
    var lastInterfaceProperties = null;

    ast.walk(new uglifyjs.TreeWalker(function(node, descend){
        if(node instanceof uglifyjs.AST_Return){
            var interfaceProperties = parseInterfaceProperties(node.value);
            if(interfaceProperties){
                lastInterfaceProperties = interfaceProperties;
            }

            return true;
        }
    }));

    return lastInterfaceProperties;
}

function parseInterfaceProperties(node){
    if(!(node instanceof uglifyjs.AST_Object)){
        return null;
    }

    var propertyNames = [];

    for(var i = 0; i < node.properties.length; ++i){
        var property = node.properties[i];

        propertyNames.push(property.key);
    }

    return propertyNames;
}

module.exports = {
    validateAccessInterfaces: validateAccessInterfaces,
};