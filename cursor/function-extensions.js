

const { refine, deref, set } = require("./cursor");
const { getFunctionCallUUID, fromAsyncFunction } = require("@njudah/asynchronous/request");
const time = require("./time");
const Cursor = require("./cursor");
const compare = require("./exhaust").compare;

Function.prototype.await = function (state, ...args)
{
    const UUID = getFunctionCallUUID(this, undefined, args);

    if (deref.in(state, ["function", "UUID"], { }) === UUID)
    {
        const response = deref.in(state, ["response"]);

        if (!response)
            return undefined;

        if (response.isError)
            throw response.value;

        return response.value;
    }

    set(state, fromAsyncFunction(this)(...args));

    return null;
}

Function.prototype.memoizedCall = function (aCursor, ...args)
{
    const previousResult = refine(aCursor, "previousResult");
    const previousArguments = refine(aCursor, "previousArguments");
    const currentArguments = args;//I.fromJS(args);
    //console.log(args, previousArguments);
    if (compare(args, deref(previousArguments, undefined), 2))
    //if (I.is(currentArguments, deref(previousArguments, undefined)))
        return deref(previousResult);

    set(previousArguments, currentArguments);

    return set(previousResult, this.apply(this, args));
}

Function.prototype.mcall = Function.prototype.memoizedCall;


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

