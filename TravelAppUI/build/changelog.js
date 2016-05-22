const fs = require('q-io/fs');
const gutil = require('gulp-util');
const path = require('path');
const qmkdirp = require('./qmkdirp');
const svn = require('./svn');
const q = require('q');

const MAX_LOG_ENTRIES = 250;

function generateChangelogFromSvn(outputPath, svnRootPath){
    return q.when()
        .then(function(){
            return q.all([
                fetchSvnLog(svnRootPath),
                qmkdirp(path.dirname(outputPath)),
            ]);
        })
        .then(function(args){
            var logEntries = args[0];

            return fs.write(outputPath, JSON.stringify(logEntries));
        });
}

function fetchSvnLog(svnRootPath){
    return q.when()
        .then(function(){
            return svn.log(svnRootPath, {
                limit: '' + MAX_LOG_ENTRIES
            })
                .catch(function(e){
                    gutil.log(gutil.colors.yellow('SVN log not available'));

                    return {
                        log: {
                            logentry: []
                        }
                    };
                });
        })
        .then(function(log){
            var entries = [];

            for(var i = 0; i < log.log.logentry.length; ++i){
                var logEntry = log.log.logentry[i];

                entries.push({
                    revision: logEntry._attribute.revision,
                    author: logEntry.author._text,
                    date: logEntry.date._text,
                    message: logEntry.msg._text,
                });
            }

            return entries;
        });
}

module.exports = {
    generateChangelogFromSvn: generateChangelogFromSvn,
};
