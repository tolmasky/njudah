
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);
const hasOwnProperty = Object.prototype.hasOwnProperty;
const is = Object.is || ObjectIs;
const ObjectKeys = Object.keys;

const { base, getArguments } = require("generic-jsx");
const ArrayFilter = Array.prototype.filter;
const isArray = Array.isArray;
const ArrayMap = Array.prototype.map;

const { deref, Cursor, isCursor, stem } = require("./cursor");

const I = require("immutable");
const isList = I.List.isList;
const isIterable = I.Iterable.isIterable;

const time = require("./time");

function Node({ binding = null, children = null })
{
    this.binding = binding;
    this.children = children;
}

function Binding({ base = null, function: aFunction = null, attributes = null, children = null, value = null })
{
    this.base = base;
    this.function = aFunction;
    this.attributes = attributes;
    this.children = children;
    this.value = value;
}

function exhaust(aFunction, aPreviousResult)
{
    const previousBinding = aPreviousResult && aPreviousResult.binding;
    const binding = toBinding(aFunction, previousBinding);

    if (previousBinding && (previousBinding === binding))// || Binding.is(previousBinding, aBinding)))
        return aPreviousResult;

    if (!binding.base)
        return new Node({ binding });

    const resultValue = binding.function();
    const previousChildren = aPreviousResult && aPreviousResult.children;

    if (!isFunction(resultValue) || base(resultValue) !== stem)
        return new Node(
        {
            binding,
            children: [exhaust(resultValue, previousChildren && previousChildren[0])]
        });

    const { children = [] } = getArguments(resultValue);

    return new Node(
    {
        binding,
        children: flatten(children).map((aChild, anIndex) =>
            exhaust(aChild, previousChildren && previousChildren[anIndex]))
    });
}

module.exports = exhaust;

function isFunction(aValue)
{
    return typeof aValue === "function";
}

const FlattenedSymbol = Symbol("flattened");
const flatten = function flatten(from, into = [], recurse = true)
{
    if (from.length === 0)
        return from;
    
    if (recurse && from[FlattenedSymbol])
        return from[FlattenedSymbol];

    var index = 0;
    const asList = isList(from);
    const count = !asList ? from.length : from.size;

    for (; index < count; ++index)
    {
        const item = asList ? from.get(index) : from[index];

        if (recurse && (isArray(item) || isList(item)))
            flatten(item, into, false);

        else
            into[into.length] = item;
    }

    if (recurse)
        from[FlattenedSymbol] = into;

    return into;
}

function toBinding(aValue, aPreviousBinding)
{
    if (typeof aValue !== "function")
        return  aPreviousBinding && !aPreviousBinding.base && is(aValue, aPreviousBinding.value) ?
                aPreviousBinding : new Binding({ value: aValue });

    const attributes = getArguments(aValue);
    const flattened = flatten(attributes.children);

    const serializedAttributes = serialize(attributes, aPreviousBinding && aPreviousBinding.attributes);
    const bindingChildren = toBindingChildren(flattened, aPreviousBinding && aPreviousBinding.children);//flattened.map((aChild, anIndex) => toBinding(aChild, aPreviousBinding && aPreviousBinding.children[anIndex]));

    if (aPreviousBinding && base(aValue) === aPreviousBinding.base &&
        (serializedAttributes === aPreviousBinding.attributes) &&
        bindingChildren === aPreviousBinding.children)
        return aPreviousBinding;

    return new Binding(
    {
        base: base(aValue),
        function: aValue,
        attributes: serializedAttributes,
        children: bindingChildren
    });
}

function toBindingChildren(anArray, previousChildren)
{
    const children = [];
    var index = 0;
    var different = false;
    const count = anArray.length;

    for (; index < count; ++index)
    {
        const binding = toBinding(anArray[index], previousChildren && previousChildren[index]);

        children.push(binding);
        different = different || binding !== (previousChildren && previousChildren[index]);
    }

    if (different)
    {
        
        return children;
    }
    
//    if (!every(children, previousChildren || [], Binding.is))
//            console.log("_");
    
    return previousChildren || [];
}

function toArray(anArray)
{
    if (isArray(anArray))
        return anArray;

    if (isList(anArray))
        return anArray.toArray();

    return anArray;
}



function serialize(attributes, previousAttributes)
{
    const keys = Object.keys(attributes);
    const serialized = Object.create(null);
    const EMPTY = { };

    var index = 0;
    var different = false;
    const count = keys.length;

    for (; index < count; ++index)
    {
        const key = keys[index];
        const previousAttribute = previousAttributes && previousAttributes[key];

        serialized[key] = serialize(attributes[key], previousAttribute);
        different = different || serialized[key] !== previousAttribute;
    }
    
    if (!different)
        return previousAttributes;

    function serialize(anAttribute, aPreviousSerialization)
    {
        if (!isCursor(anAttribute))
        {
            if (aPreviousSerialization &&
                !aPreviousSerialization.keyPath &&
                is(anAttribute, aPreviousSerialization.value))
                return aPreviousSerialization;

            return new Attribute(null, anAttribute);
        }
        
        const value = deref(anAttribute, EMPTY);
        const empty = value === EMPTY;

        if (aPreviousSerialization &&
            aPreviousSerialization.keyPath &&
            aPreviousSerialization.empty === empty &&
            (empty || compare(value, aPreviousSerialization.value, 2)))
            return aPreviousSerialization;

        return new Attribute(anAttribute.keyPath, value, empty);
    }

    return serialized;
}

function Attribute(aKeyPath, aValue, isEmpty)
{
    this.keyPath = aKeyPath;
    this.value = aValue;
    this.empty = isEmpty;
}

function compare(lhs, rhs, depth)
{
    if (is(lhs, rhs))
        return true;

    var lhsIsIterable = isIterable(lhs);
    var rhsIsIterable = isIterable(rhs); 

    if (lhsIsIterable !== rhsIsIterable || lhsIsIterable || rhsIsIterable)
        return false;

    var lhsType = typeof lhs;
    var rhsType = typeof rhs;

    if (lhsType !== "object" || lhs === null || rhsType !== 'object' || rhs === null)
        return false;

    if (Object.getPrototypeOf(lhs) !== Object.getPrototypeOf(rhs))
        return false;

    if ((lhs instanceof Date && rhs instanceof Date) ||
        (lhs instanceof RegExp && rhs instanceof RegExp) ||
        (lhs instanceof String && rhs instanceof String) ||
        (lhs instanceof Number && rhs instanceof Number))
        if (lhs.toString() !== rhs.toString())
            return false;

    var lhsKeys = Object.keys(lhs);
    var rhsKeys = Object.keys(rhs);

    if (lhsKeys.length !== rhsKeys.length)
        return false;

    var childCompare = depth > 1 ? compare : is;

    // Test for A's keys different from B.
    for (var i = 0; i < lhsKeys.length; i++)
    {
        var key = lhsKeys[i];

        if (!hasOwnProperty.call(rhs, key) || !childCompare(lhs[key], rhs[key]))
            return false;
    }

    return true;
}

module.exports.compare = compare;
Node.prototype.toString = function (depth = 0)
{
    var index = 0;
    var padding = "";

    for (;index < depth; ++index)
        padding += "    ";

    if (!this.binding.base)
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



