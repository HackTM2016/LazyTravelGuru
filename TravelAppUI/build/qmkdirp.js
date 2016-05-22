const mkdirp = require('mkdirp');
const q = require('q');

function qmkdirp(){
    var deferred = q.defer();

    var args = Array.prototype.slice.call(arguments);
    args.push(function(e){
        if(e){
            deferred.reject(e);
        }
        else{
            deferred.resolve();
        }
    });

    mkdirp.apply(mkdirp, args);

    return deferred.promise;
}

module.exports = qmkdirp;