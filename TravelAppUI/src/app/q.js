travelApp.config(function($provide){
    $provide.decorator('$q', function($delegate){
        const originalDefer = $delegate.defer;
        $delegate.defer = function(){
            const deferred = originalDefer.apply(this, arguments);

            deferred.cancelled = false;

            mergeCancelApiIntoPromise(null, deferred.promise, cancel);

            function cancel(){
                if(deferred.cancelled){
                    return;
                }

                deferred.cancelled = true;

                if(deferred.cancellation){
                    deferred.cancellation();
                }
            }

            return deferred;
        };

        const originalWhen = $delegate.when;
        $delegate.when = function(){
            const promise = originalWhen.apply(this, arguments);

            mergeCancelApiIntoPromise(null, promise, null);

            return promise;
        };

        return $delegate;
    });

    function mergeCancelApiIntoPromise(parentPromise, promise, deferredCancel){
        const collectedPromises = [];

        const originalThen = promise.then;
        promise.then = function(){
            const originalThenCallback = arguments[0];
            const args = Array.prototype.slice.call(arguments);

            if(typeof(originalThenCallback) === 'function'){
                args.splice(0, 1, function(value){
                    const result = originalThenCallback(value);

                    if(typeof(result) === 'object' && result && result.cancel){
                        collectedPromises.push(result);
                    }

                    return result;
                });
            }

            const chainedPromise = originalThen.apply(promise, args);

            mergeCancelApiIntoPromise(promise, chainedPromise, null);
            collectedPromises.push(chainedPromise);

            return chainedPromise;
        };

        const originalCatch = promise.catch;
        promise.catch = function(){
            const chainedPromise = originalCatch.apply(this, arguments);

            mergeCancelApiIntoPromise(promise, chainedPromise, null);
            collectedPromises.push(chainedPromise);

            return chainedPromise;
        };

        const originalCancel = promise.cancel;
        promise.cancel = function(){
            while(collectedPromises.length > 0){
                const collectedPromise = collectedPromises.splice(0, 1)[0];

                collectedPromise.cancel();
            }

            if(deferredCancel){
                deferredCancel();
            }

            if(originalCancel){
                originalCancel();
            }

            if(parentPromise && parentPromise.cancel){
                parentPromise.cancel();
            }
        };
    }
});
