

const { refine, deref, set } = require("./cursor");
const { getUUID, fromAsyncFunction } = require("@njudah/asynchronous/request");

var Cursor = require("./cursor");
var I = require("immutable");

module.exports = 0;


function wait(aState, aFunction, aUUID, ...args)
{
    const UUID = getUUID(aFunction, aUUID, args);

    if (deref.in(aState, ["function", "UUID"], { }) === UUID)
        return deref.in(aState, ["response", "value"]);

    set(aState, fromAsyncFunction(aFunction, aUUID)(...args));

    return null;    
}

Object.defineProperty(Function.prototype, "result",
{
    get: function ()
    {
        const thisFunction = this;

        return Object.defineProperty(this, "result",
        {
            value: function({ state, ...args })
            {
                const result = thisFunction.await(state, args);
        
                if (result)
                    return result;
            
                return "Loading...";
            }
        }).result;
    }
});

Function.prototype.memoizedCall = function (aCursor, ...args)
{
    const previousResult = refine(aCursor, "previousResult");
    const previousArguments = refine(aCursor, "previousArguments");
    const currentArguments = I.fromJS(args);
    
    if (I.is(currentArguments, deref(previousArguments, undefined)))
        return deref(previousResult);

    set(previousArguments, currentArguments);

    return set(previousResult, this.apply(this, args));
}

Function.prototype.await = function (state, ...args)
{
    return wait(state, this, undefined, ...args);
}

Function.prototype.promisified = function (state, ...args)
{
    const thisFunction = this;

    return function ()
    {
        const self = this;

        return new Promise(function (resolve, reject)
        {
            return thisFunction.call(self, ...args, function (err, result)
            {
                if (err)
                    return reject(err);

                return resolve(overload || result);
            });
        });
    }.await(state, ...args);
}

