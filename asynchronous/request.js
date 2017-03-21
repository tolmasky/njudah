
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);

const ArraySlice = Array.prototype.slice;
const hasOwnProperty = Object.prototype.hasOwnProperty;

const I = require("immutable");
const { base } = require("generic-jsx");
const getChecksum = require("@njudah/get-checksum");

const AsynchronousRequest = I.Record({ function: null, response: null }, "AsynchronousRequest");
const AsynchronousFunction = I.Record({ UUID: null, function: null }, "AsynchronousFunction");
const AsynchronousResponse = I.Record({ isError: false, value: null }, "AsynchronousResponse");

module.exports = AsynchronousRequest;

function toAsynchronousFunction(aFunction, aUUID, args)
{
    return AsynchronousFunction({ UUID: getUUID(aFunction, aUUID, args), function: aFunction });
}

function fromPushFunction(aFunction, aUUID)
{
    return function()
    {
        return new AsynchronousRequest(
        {
            function: toAsynchronousFunction( (push, reject)=>
            {
                return aFunction(...arguments, push, reject);
            }, getFunctionUUID(aFunction, aUUID), Call(ArraySlice, arguments))
        });
    }
}

module.exports.fromPushFunction = fromPushFunction;

const NativeRegExp = /^function [$A-Z_a-z][0-9A-Z_a-z$]*\(\) { \[native code\] }$/;
const UUIDSymbol = Symbol("UUID");

function getUUID(aFunction, aUUID, args)
{
    return getFunctionUUID(aFunction, aUUID) + argumentsUUID(args);
}

function argumentsUUID(args)
{
    if (args.length === 0)
        return "";

    if (args.length === 1)
    {
        const first = args[0];
        const type = typeof first;
        
        if (type === "function")
            return type + " " + getUUID(first, null, []);

        if (type !== "object")
            return type + " " + first;
        
        if (first === "null")
            return "null";

        return first[UUIDSymbol] || (first[UUIDSymbol] = "object " + JSON.stringify(first));
    }
    
console.log("called...", args);
    return JSON.stringify(args);
}

function getFunctionUUID(aFunction, aUUID)
{
    if (aUUID)
        return aUUID;

    if (typeof aFunction[UUIDSymbol] === "string")
        return aFunction[UUIDSymbol];
//    if (Call(hasOwnProperty, aFunction, UUIDSymbol))
//        return aFunction[UUIDSymbol];

    const source = base(aFunction) + "";

    if (NativeRegExp.test(source))
        throw new Error("Can't auto-generate UUID.");

    return aFunction[UUIDSymbol] = getChecksum(source);
}

module.exports.getUUID = getUUID;

function fromAsyncFunction(aFunction, aUUID)
{
    return fromPushFunction(async function ()
    {
        try
        {
            arguments[arguments.length - 2](await aFunction.apply(this, ArraySlice.call(arguments, 0, arguments.length - 2)));
        }
        catch (anException)
        {console.log("||"+anException);
            arguments[arguments.length - 1](anException);
        }
    }, getFunctionUUID(aFunction, aUUID));
}

module.exports.fromAsyncFunction = fromAsyncFunction;

module.exports.AsynchronousRequest = AsynchronousRequest;
module.exports.AsynchronousResponse = AsynchronousResponse;



