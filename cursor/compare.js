
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);
const hasOwnProperty = Object.prototype.hasOwnProperty;
const is = Object.is || ObjectIs;
const ObjectKeys = Object.keys;
const ArrayConcat = Array.prototype.concat;
const { base, getArguments } = require("generic-jsx");
const ArrayFilter = Array.prototype.filter;
const isArray = Array.isArray;
const ArrayMap = Array.prototype.map;

const Cursor = require("./cursor");

const I = require("immutable");
const isList = I.List.isList;


const Node = I.Record({ binding:null, children: null }, "Node");
const Binding = I.Record({ function:null, attributes:null, children:null, value: null, isValue: false }, "Binding");

module.exports = function exhaust(aFunction, previous)
{//console.log("EXHASTING " + aFunction);
    const binding = toBinding(aFunction);

    if (binding.isValue)
        return Node({ binding });


//console.log("COMPARING " + binding.function.name + " to " + !!previous + " " + (previous && previous.binding && previous.binding.function.name));
    if (previous && Binding.is(binding, previous.binding, previous))
        return previous;

    const nextFunction = aFunction();
    const children = typeof nextFunction === "function" ? [{ function:nextFunction }] : binding.children;
//console.log("using " + (typeof nextFunction === "function" ? [{ function:nextFunction }] : binding.children));

    return Node(
    {
        binding: binding,
        children: Call(ArrayMap, children, (aChild, anIndex) => exhaust(aChild.isValue ? aChild.value : aChild.function, previous && previous.children && previous.children[anIndex]))
    });
}


function toBinding(aFunction)
{
    if (typeof aFunction !== "function")
        return Binding({ value: aFunction, isValue: true });

    const { children, ...attributes } = getArguments(aFunction);
    const flat = Apply(ArrayConcat, [], Call(ArrayMap, children, toArray));

    return Binding(
    {
        base: base(aFunction),
        function: aFunction,
        attributes: serialize(attributes),
        children: Call(ArrayMap, flat, toBinding)
    });
}

function toArray(anArray)
{
    if (isArray(anArray))
        return anArray;

    if (isList(anArray))
        return anArray.toArray();

    return anArray;
}

function serialize(attributes)
{
    const keys = Object.keys(attributes);
    const serialized = Object.create(null);
    const EMPTY = { };

    var index = 0;
    const count = keys.length;

    for (; index < count; ++index)
        serialized[keys[index]] = serialize(attributes[keys[index]]);

    function serialize(anAttribute)
    {
        if (!Cursor.isCursor(anAttribute))
            return { value: Cursor.deref(anAttribute) };

        const value = Cursor.deref(anAttribute, EMPTY);

        if (value === EMPTY)
            return { keyPath: anAttribute.keyPath };

        return { keyPath: anAttribute.keyPath, value: Cursor.deref(anAttribute, EMPTY) };
    }

    return serialized;
}


Node.prototype.equals = function (aNode)
{
    if (!(aNode instanceof Node))
        return false;

    if (aNode.isValue !== this.isValue)
        return false;

    if (aNode.isValue)
        return I.is(this.value, aNode.value);

//    return false;
//console.log(I.fromJS(aNode.attributes));
    return I.is(I.fromJS(this.props), I.fromJS(aNode.props)) && I.is(I.List(this.children), I.List(aNode.children));
}

Node.prototype.toString = function (depth = 0)
{
    var index = 0;
    var padding = "";

    for (;index < depth; ++index)
        padding += "    ";

    if (this.binding.isValue)
        return padding + this.binding.value;

    const binding = this.binding;
    const children = this.children
        .filter(aNode => !!aNode)
        .map(aNode => aNode.toString(depth + 1))
        .join("\n");
    return padding + "<" + binding.function.name + " " + Object.keys(binding.attributes).map(aKey =>
    {
    if (aKey === "settings") return "";
    if (aKey === "state") return "";
        return "\"" + aKey + "\" = " + toJSON(binding.attributes[aKey].value);
    }).join(" ") + (children.length > 0 ? ">\n" + children + "\n" + padding + "</" + binding.function.name + ">" : "/>");
}

function toJSON(anObject)
{
    try
    {
        return JSON.stringify(anObject);
    }
    catch (e)
    {console.log("CANT FIGURE OUT " + Object.keys(anObject));
        return "what";
    }
}


Binding.is = function(lhs, rhs, p)
{
    if (lhs.isValue !== rhs.isValue)
        return false;

    if (lhs.isValue)
        return lhs.value === rhs.value;

    return  lhs.base === rhs.base &&
            every(lhs.attributes, rhs.attributes, equalAttributes) &&
            every(lhs.children, rhs.children, Binding.is);
}

function every(lhs, rhs, equals)
{
    const lhsKeys = ObjectKeys(lhs);
    const rhsKeys = ObjectKeys(rhs);

    if (lhsKeys.length !== rhsKeys.length)
        return false;

    var index = 0;
    const count = rhsKeys.length;

    for (; index < count; ++index)
        if (!equals(lhs[lhsKeys[index]], rhs[lhsKeys[index]]))
            return false;

    return true;
}

function equalAttributes(lhs, rhs)
{
    const lhsIsCursor = Call(hasOwnProperty, lhs, "keyPath");
    const rhsIsCursor = Call(hasOwnProperty, rhs, "keyPath");

    if (lhsIsCursor !== rhsIsCursor)
        return false;

    if (lhsIsCursor)
    {
        const lhsHasValue = Call(hasOwnProperty, lhs, "value");
        const rhsHasValue = Call(hasOwnProperty, rhs, "value");

        if (lhsHasValue !== rhsHasValue)
            return false;

        if (!lhsHasValue)
            return true;
    }

    return object(lhs.value, rhs.value);
}

function object(lhs, rhs)
{
    if (is(lhs, rhs))
        return true;

    if (I.is(lhs, rhs))
        return true;

    var lhsType = typeof lhs;
    var rhsType = typeof rhs;

    if (lhsType !== "object" || lhs === null || rhsType !== 'object' || rhs === null)
        return false;

    if ((lhs instanceof Date && rhs instanceof Date) ||
        (lhs instanceof RegExp && rhs instanceof RegExp) ||
        (lhs instanceof String && rhs instanceof String) ||
        (lhs instanceof Number && rhs instanceof Number))
        if (lhs.toString() !== rhs.toString())
            return false;

    var lhsKeys = ObjectKeys(lhs);
    var rhsKeys = ObjectKeys(rhs);

    if (lhsKeys.length !== rhsKeys.length)
        return false;

    // Test for A's keys different from B.
    for (var i = 0; i < lhsKeys.length; i++)
    {
        var key = lhsKeys[i];

        if (!Call(hasOwnProperty, rhs, key) || !is(lhs[key], rhs[key]))
            return false;
    }

    return true;
}

function ObjectIs(x, y)
{
    // SameValue algorithm
    if (x === y)
    {
        // Steps 1-5, 7-10
        // Steps 6.b-6.e: +0 != -0
        return x !== 0 || 1 / x === 1 / y;
    }

    else
    {
        // Step 6.a: NaN == NaN
        return x !== x && y !== y;
    }
};



