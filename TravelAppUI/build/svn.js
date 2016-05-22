const q = require('q');
const svn = require('svn-interface');

function info(files, options){
    const deferred = q.defer();

    svn.info(files, options, function(e, data){
        if(e){
            deferred.reject(e);
        }
        else{
            deferred.resolve(data);
        }
    })
        .on('error', function(e){
            deferred.reject(e);
        });

    return deferred.promise;
}

function log(files, options){
    const deferred = q.defer();

    svn.log(files, options, function(e, data){
        if(e){
            deferred.reject(e);
        }
        else{
            deferred.resolve(data);
        }
    })
        .on('error', function(e){
            deferred.reject(e);
        });

    return deferred.promise;
}

function status(files, options){
    const deferred = q.defer();

    svn.status(files, options, function(e, data){
        if(e){
            deferred.reject(e);
        }
        else{
            deferred.resolve(data);
        }
    })
        .on('error', function(e){
            deferred.reject(e);
        });

    return deferred.promise;
}

module.exports = {
    info: info,
    log: log,
    status: status
};
