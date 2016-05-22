var eventStream = require('event-stream');
var fs = require('q-io/fs');
var gutil = require('gulp-util');
var path = require('path');
var q = require('q');
var qmkdirp = require('./qmkdirp');
var spelling = require('./spelling');
var through = require('through2');

function collect(filePath){
    var allTranslations = {};

    function collectTranslations(file, enc, cb){
        var translations = JSON.parse(file.contents);

        for(var translationKey in translations){
            if(!translations.hasOwnProperty(translationKey)){
                continue;
            }

            try {
                mergeTranslation(translationKey, translations[translationKey]);
            }
            catch(e){
                this.emit('error', e);
                cb();
                return;
            }
        }

        cb();
        return;
    }

    function mergeTranslation(translationKey, translationValue){
        if(allTranslations.hasOwnProperty(translationKey)){
            throw new Error('Duplicate translation key: ' + translationKey);
        }

        allTranslations[translationKey] = translationValue;
    }

    function flushCollectedTranslations(cb){
        var combinedFile = new gutil.File();
        combinedFile.path = filePath;
        combinedFile.contents = new Buffer(JSON.stringify(allTranslations));

        this.push(combinedFile);
        cb();
    }

    return through.obj(collectTranslations, flushCollectedTranslations);
}

function checkSpelling(language){

    function checkSpellingForFile(file, enc, cb){
        var parent = this;

        var translations = JSON.parse(file.contents);

        checkSpellingOfTranslations(language, translations)
            .then(function(){
                parent.push(file);
                cb();
            })
            .catch(function(e){
                gutil.log(gutil.colors.red(e));

                process.exit(1);
            });
    }

    return through.obj(checkSpellingForFile);
}

var DICTS_DIR = path.join(__dirname, '..', 'dicts');

var DICT_PATHS = {
    de: [
        path.join(DICTS_DIR, 'common.dic'),
        path.join(DICTS_DIR, 'de.dic'),
        path.join(DICTS_DIR, 'de', 'germandict', 'german.dic'),
        path.join(DICTS_DIR, 'de', 'libreoffice', 'de_DE_frami.dic'),
    ],
};

function checkSpellingOfTranslations(language, translations){
    var cachedDictPath = path.join(__dirname, '..', 'target', 'dict', language + '.dic');

    return q.when()
        .then(function(){
            return checkSpellingRules(language, translations);
        })
        .then(function() {
            return fs.exists(cachedDictPath);
        })
        .then(function(cacheDictExists) {
            if (cacheDictExists) {
                gutil.log('Using cached dict for language ' + language);
                return spelling.loadDictionary(cachedDictPath);
            }
            else {
                return null;
            }
        })
        .then(function(cacheDict) {
            if (cacheDict) {
                return checkSpellingViaDictionary(cacheDict, translations)
                    .then(function () {
                        return true;
                    })
                    .catch(function (e) {
                        return false;
                    });
            }
            else{
                return false;
            }
        })
        .then(function(cacheValidationSuccessful){
            if(!cacheValidationSuccessful){
                if(DICT_PATHS.hasOwnProperty(language)){
                    gutil.log('Using whole dict for language ' + language);

                    return q.all(DICT_PATHS[language].map(function(dictPath){
                        return spelling.loadDictionary(dictPath);
                    }))
                        .then(function(dicts){
                            var dict = mergeAndNormalizeDictionaries(dicts);

                            return checkSpellingViaDictionary(dict, translations);
                        })
                        .then(function(usedWordsDict){
                            return saveDict(cachedDictPath, usedWordsDict);
                        });
                }
                else{
                    gutil.log(gutil.colors.yellow('No dictionary found for language ' + language));
                }
            }
        });
}

function checkSpellingRules(language, translations){
    return checkOkLabels(language, translations);
}

function checkOkLabels(language, translations){
    for(var l10nKey in translations){
        if(!translations.hasOwnProperty(l10nKey)){
            continue;
        }

        var l10nText = translations[l10nKey];
        if(!isOkLabelSynonym(l10nText)){
            continue;
        }

        if(l10nText === 'OK'){
            continue;
        }

        throw new Error('Illegal spelling of OK in language ' + language + ' and key ' + l10nKey + ': ' + l10nText);
    }
}

var OK_LABEL_SYNONYMS = {
    ok: true,
    okay: true
};

function isOkLabelSynonym(text){
    return OK_LABEL_SYNONYMS[text.toLowerCase()];
}

function saveDict(dictPath, dict){
    var dictDir = path.dirname(dictPath);

    return q.when()
        .then(function(){
            return fs.exists(dictDir);
        })
        .then(function(dictDirExists){
            if(!dictDirExists){
                return qmkdirp(dictDir);
            }
        })
        .then(function(){
            return spelling.saveDictionary(dictPath, dict);
        });
}

function mergeAndNormalizeDictionaries(dicts){
    var superDict = {};

    for(var i = 0; i < dicts.length; ++i){
        var dict = dicts[i];

        for(var word in dict){
            if(!dict.hasOwnProperty(word)){
                continue;
            }

            var normalizedWord = normalizeWord(word);
            superDict[normalizedWord] = true;
        }
    }

    return superDict;
}

function checkSpellingViaDictionary(dict, translations){
    return q.when()
        .then(function(){
            var wordCounter = 0;
            var usedDictWords = {};

            for(var l10nKey in translations){
                if(!translations.hasOwnProperty(l10nKey)){
                    continue;
                }

                var sentence = translations[l10nKey];
                var words = splitSentence(sentence);

                for(var i = 0; i < words.length; ++i){
                    var word = words[i];

                    var strippedWord = stripWord(word);
                    if(strippedWord.length === 0){
                        continue;
                    }

                    if(isPlaceholder(strippedWord)){
                        continue;
                    }

                    if(isNumber(strippedWord)){
                        continue;
                    }

                    var normalizedWord = normalizeWord(strippedWord);
                    wordCounter += 1;

                    if(!dict.hasOwnProperty(normalizedWord)){
                        throw new Error('Unknown word "' + strippedWord + '" in l10n key ' + l10nKey);
                    }
                    else{
                        usedDictWords[normalizedWord] = true;
                    }
                }
            }

            return usedDictWords;
        });
}

var WORD_CORE_PATTERN = /^[("=/]*([{}a-zA-Z0-9_ÄÖÜäöüß+-]*)[%):.!,"?]*$/;

function normalizeWord(word){
    return word.substring(0, 1).toLowerCase() + word.substring(1);
}

function stripWord(word){
    var m = word.match(WORD_CORE_PATTERN);
    if(m){
        word = m[1];
    }

    return word;
}

function isPlaceholder(word){
    return word.lastIndexOf('{{', 0) !== -1 && word.indexOf('}}', word.length - 2) !== -1;
}

var NUMBER_PATTERN = /^[0-9,.]+$/;

function isNumber(word){
    return word.match(NUMBER_PATTERN);
}

function splitSentence(sentence){
    var words = [sentence];

    var splitter = [' ', '/'];
    for(var i = 0; i < splitter.length; ++i){
        var splitStr = splitter[i];

        var wordsLength = words.length;
        for(var w = wordsLength - 1; w >= 0; --w){
            var word = words[w];

            var subwords = word.split(splitStr);
            if(subwords.length <= 1){
                continue;
            }

            wordsLength -= 1;
            words.splice(w, 1);

            words = words.concat(subwords);
        }

    }

    return words;
}

function buildAngularTranslateConfig(language){
    function transform(file, cb){
        var translations = JSON.parse(file.contents);

        file.contents = new Buffer(renderTranslateConfig(language, translations));

        return cb(null, file);
    }

    return eventStream.map(transform);
}

function renderTranslateConfig(language, translations){
    var out = '';

    out += 'angular.module(\'vofapl\').config(function($translateProvider){';

    out += '$translateProvider.translations(\'';
    out += language;
    out += '\', ';
    out += JSON.stringify(translations)
    out += ');';

    out += '});'

    return out;
}

module.exports = {
    collect: collect,
    checkSpelling: checkSpelling,
    buildAngularTranslateConfig: buildAngularTranslateConfig
};
