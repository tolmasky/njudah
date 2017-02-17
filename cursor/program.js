

const I = require("immutable");
const { Cursor, refine, set, deref } = require("./cursor");

const { base, getArguments } = require("generic-jsx");
const asynchronousProgram = require("@njudah/asynchronous/program");
const AsynchronousRequest = require("@njudah/asynchronous/request");
const exhaust = require("./exhaust");

require("./function-extensions");


const CursorState = I.Record({ tree: null, children: null, attributes: null, mutables: null }, "CursorState");


function program (aComponent, pull)
{
    const aFunction = base(aComponent);
    const { children, ...attributes } = getArguments(aComponent);
    const initialState = CursorState({ tree:null, children, ...getInitialAttributes(attributes) });

    return asynchronousProgram(initialState, function update(aState)
    {
        const cursor = new Cursor(aState);
        const attributes = getAttributesObject(cursor, aState);

        const tree = exhaust(<aFunction { ...attributes} children = { aState.children } />, aState.tree);
        const result = deref(cursor);

        tree.__asynchronousIgnore = true;

        return result.setIn(["tree"], tree);
    }, pull);
}

module.exports = program;
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
    const mutables = [];

    for (; index < count; ++index)
    {
        const key = keys[index];
        const value = attributesSpec[key];
    
        if (value && typeof value === "object" && value[MutableSymbol] === true)
        {
            mutables.push(key);
            attributes[key] = value.value;
        }
        else
            attributes[key] = value;
    }

    if (!attributes["state"])
    {
        attributes["state"] = I.Map();
        mutables.push("state");
    }

    return { attributes: I.fromJS(attributes), mutables: I.Set(mutables) };
}

function getAttributesObject(aCursor, aCursorState)
{
    const mutables = aCursorState.mutables;
    const attributes = aCursorState.attributes;

    return attributes.reduce(function (attributes, _, aKey)
    {
        attributes[aKey] = (mutables.has(aKey) ? refine : deref.in)(aCursor, ["attributes", aKey]);

        return attributes;
    }, { });
}

