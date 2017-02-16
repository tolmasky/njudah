

const { refine, derefIn, set } = require("./cursor");
const AsynchronousRequest = require("@njudah/asynchronous/request");

var Cursor = require("./cursor");
var I = require("immutable");

module.exports = 0;


function wait(aState, aFunction, aUUID, ...args)
{
    const UUID = AsynchronousRequest.getUUID(aFunction, aUUID, args);

    if (derefIn(aState, ["function", "UUID"], { }) === UUID)
        return derefIn(aState, ["response", "value"]);

    set(aState, AsynchronousRequest.fromAsyncFunction(aFunction, aUUID)(...args));

    return null;    
}

Cursor.prototype.byCalling = function (aFunction, ...args)
{
    const UUID = AsynchronousRequest.getUUID(aFunction, undefined, args);

    if (derefIn(aState, ["function", "UUID"], { }) === UUID)
        return derefIn(aState, ["response", "value"]);

    set(aState, AsynchronousRequest.fromAsyncFunction(aFunction, undefined)(...args));

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
    var previousResult = Cursor.refine(aCursor, "previousResult");
    var previousArguments = Cursor.refine(aCursor, "previousArguments");

    var currentArguments = I.fromJS(args);
    if (I.is(currentArguments, Cursor.deref(previousArguments, undefined)))
        return Cursor.deref(previousResult);

    var result = this.apply(this, args);

    Cursor.set(previousArguments, currentArguments);
    Cursor.set(previousResult, result);

    return result;
}
/*
const isList = I.List.isList;

function equal(currentArguments, lastArguments)
{
    if (currentArguments === lastArguments)
        return true;

    if (!isList(lastArguments))
        return false;

    if (currentArgument.size !== lastArguments.size)
        return false;

    var index = 0;
    const count = currentArguments.size;
}*/

Function.prototype.await = function (state, ...args)
{
    return wait(state, this, undefined, ...args);
}

Function.prototype.promisifed = function (state, ...args)
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

