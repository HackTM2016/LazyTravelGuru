var fs = require('q-io/fs');
var q = require('q');

function loadDictionary(dictionaryPath){
    return q.when()
        .then(function(){
            return fs.read(dictionaryPath, {
                charset: 'utf-8',
            });
        })
        .then(function(dictContent){
            var dict = {};

            var lines = dictContent.split('\n');

            for(var i = 0; i < lines.length; ++i){
                var line = lines[i].trim();

                if(line[0] === '#'){
                    continue;
                }

                var word;

                var slashIndex = line.indexOf('/');
                if(slashIndex === -1){
                    word = line;
                }
                else{
                    word = line.substring(0, slashIndex);
                }

                if(word.length === 0){
                    continue;
                }

                dict[word] = true;
            }

            return dict;
        });
}

function saveDictionary(dictPath, dict){
    return q.when()
        .then(function(){
            var dictStr = '';

            for(var word in dict){
                if(!dict.hasOwnProperty(word)){
                    continue;
                }

                dictStr += word;
                dictStr += '\n';
            }

            return fs.write(dictPath, dictStr, {
                charset: 'utf-8',
            })
        });
}

module.exports = {
    loadDictionary: loadDictionary,
    saveDictionary: saveDictionary,
};