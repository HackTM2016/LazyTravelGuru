var gutil = require('gulp-util');
var spawn = require('child-process-promise').spawn;

var gulpBin = detectGulpBin();

function detectGulpBin(){
    var isWin = /^win/.test(process.platform);

    return isWin ? 'node_modules\\.bin\\gulp.cmd' : './node_modules/.bin/gulp';
}

function gulp(taskId){
    // TODO pass BUILD_ID etc to subprocess
    return spawn(gulpBin, [taskId])
        .progress(function(childProcess){
            childProcess.stdout.on('data', function (data) {
                console.log(data.toString().trim());
            });

            childProcess.stderr.on('data', function (data) {
                console.log(data.toString().trim());
            });
        })
        .catch(function(e){
            gutil.log(e);
            process.exit(1);
        });
}

module.exports = {
    gulp: gulp
};