

const I = require("immutable");
const Cursor = require("./cursor");

const { base, getArguments } = require("generic-jsx");
const asynchronousProgram = require("@njudah/asynchronous/program");
const AsynchronousRequest = require("@njudah/asynchronous/request");
const exhaust = require("./compare");
require("./await");
module.exports = program;


function program (aComponent, pull)
{
    const aFunction = base(aComponent);
    const { children, ...attributes } = getArguments(aComponent);
    const initialState = I.fromJS({ tree:null, children, ...getInitialAttributes(attributes) });

    return asynchronousProgram(initialState, function update(aState)
    {
        const cursor = new Cursor(aState);
        const mutables = aState.get("mutables");
        const attributes = aState.get("attributes").reduce(function (attributes, _, aKey)
        {
            attributes[aKey] = (mutables.has(aKey) ? Cursor.refine : Cursor.derefIn)(cursor, ["attributes", aKey]);

            return attributes;
        }, { });

        const tree = exhaust(<aFunction { ...attributes} children = { aState.get("children").toArray() } />, aState.get("tree") );

        tree.__asynchronousFunctions = I.Map();
        tree.__prendingAsynchronous = I.Map();

        Cursor.setIn(cursor, "tree", tree);
        return Cursor.deref(cursor);
    }, pull);
}

module.exports.program = program;

const MutableSymbol = Symbol("Mutable");

module.exports.mutable = function (aValue)
{
    return { [MutableSymbol]: true, value: aValue };
}

function getInitialAttributes(attributesSpec)
{
    const keys = Object.keys(attributesSpec);
            var index = 0;
    const count = keys.length;
    const attributes = { };
    const mutables = { };

    for (; index < count; ++index)
    {
        const key = keys[index];
        const value = attributesSpec[key];
    
        if (value && typeof value === "object" && value.hasOwnProperty(MutableSymbol))
        {
            mutables[key] = true;
            attributes[key] = value.value;
        }
        else
            attributes[key] = value;
    }

    if (!attributes["state"])
    {
        attributes["state"] = I.Map();
        mutables["state"] = true;
    }

    return { attributes, mutables };
}

function toObject(anAttributeMap, )
{
    return anAttributeMap.reduce(function (attributes, _, aKey)
    {
        attributes[aKey] = (mutable[aKey] ? refine : derefIn)(cursor, ["attributes", aKey]);

        return attributes;
    }, { })
}

module.exports

module.exports.asynchronous = function asynchronous(aState, aFunction, aUUID, ...args)
{
    const UUID = AsynchronousRequest.getUUID(aFunction, aUUID, args);

    if (Cursor.derefIn(aState, ["function", "UUID"], { }) === UUID)
    {//console.log("="+Cursor.derefIn(aState, ["response", "value"]));
        return Cursor.derefIn(aState, ["response", "value"]);
}
//console.log(AsynchronousRequest.fromAsyncFunction(aFunction, aUUID)(...args));
    Cursor.set(aState, AsynchronousRequest.fromAsyncFunction(aFunction, aUUID)(...args));

    return null;    
}

module.exports.Node = function Node(attributes)
{
    if (!(this instanceof Node))
        return new Node();
};

