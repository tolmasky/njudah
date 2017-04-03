
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

function fromPushFunction(aFunction, aUUID)
{
    return function()
    {
        const count = arguments.length;

        var index = 0;
        const passed = [];

        for (; index < count; ++index)
            passed[index] = arguments[index];

        return new AsynchronousRequest(
        {
            function: new AsynchronousFunction(
            {
                UUID: getFunctionCallUUID(aFunction, aUUID, passed),
                function: (push, reject) => aFunction.apply(this, passed.concat(push, reject))
            })
        });
    }
}

module.exports.fromPushFunction = fromPushFunction;

const NativeRegExp = /^function [$A-Z_a-z][0-9A-Z_a-z$]*\(\) { \[native code\] }$/;
const UUIDSymbol = Symbol("UUID");

function getFunctionCallUUID(aFunction, aFunctionUUID, args)
{
    return getFunctionUUID(aFunction, aFunctionUUID) + getArgumentsUUID(args);
}

module.exports.getFunctionCallUUID = getFunctionCallUUID;

function getArgumentsUUID(args)
{
    if (args.length === 0)
        return "";

    if (args.length === 1)
    {
        const first = args[0];
        const type = typeof first;
        
        if (type === "function")
            return type + " " + getFunctionCallUUID(first, null, []);

        if (type !== "object")
            return type + " " + first;
        
        if (first === null)
            return "null";

        return first[UUIDSymbol] || (first[UUIDSymbol] = "object " + JSON.stringify(first));
    }
    
console.log("called...", args);
    return JSON.stringify(args);
}

function getFunctionUUID(aFunction, aUUID)
{
    return aUUID || getBaseFunctionUUID(aFunction);
}

function getBaseFunctionUUID(aFunction)
{
    const baseFunction = base(aFunction);
    const baseUUID = aFunction[UUIDSymbol];

    if (typeof baseUUID === "string")
        return baseUUID;

    const source = baseFunction + "";

    if (NativeRegExp.test(source))
        throw new Error("Can't auto-generate UUID.");

    return baseFunction[UUIDSymbol] = baseFunction.name + " " + getChecksum(source);
}

function fromAsyncFunction(aFunction, aUUID, another)
{
    return fromPushFunction(function ()
    {
        const count = arguments.length;
        const push = arguments[count - 2];
        const reject = arguments[count - 1];
        
        var index = 0;
        const passed = [];
        
        for (; index < count - 2; ++index)
            passed[index] = arguments[index];

        aFunction.apply(this, passed)
            .then(push)
            .catch(reject)
    }, getFunctionUUID(aFunction, aUUID));
}

module.exports.fromAsyncFunction = fromAsyncFunction;

module.exports.AsynchronousRequest = AsynchronousRequest;
module.exports.AsynchronousResponse = AsynchronousResponse;



