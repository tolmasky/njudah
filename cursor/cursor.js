
const I = require("immutable");
const isIterable = I.Iterable.isIterable;

const isArray = Array.isArray;


var missing = { };

function Cursor(aParentCursorOrBaseObject, aKey)
{
    if (!(this instanceof Cursor))
    {
        if (arguments.length === 0)
            return new Cursor();

        if (arguments.length === 1)
            return new Cursor(aParentCursorOrBaseObject);

        return new Cursor(aParentCursorOrBaseObject, aKey);
    }

    if (arguments.length < 2)
    {
        this.keyPath = I.List.of();
        this.object = aParentCursorOrBaseObject;
        this.rootCursor = this;
    }
    else
    {
        this.parent = aParentCursorOrBaseObject;
        this.key = aKey;
        this.keyPath = aParentCursorOrBaseObject.keyPath.push(aKey);
        this.cachedParentValue = { };
        this.cachedRoot = null;
        this.rootCursor = aParentCursorOrBaseObject.rootCursor;
    }
}

module.exports.Cursor = Cursor;

module.exports.stem = x => x;

function isCursor(aCursorOrObject)
{
    return aCursorOrObject instanceof Cursor;
}

module.exports.isCursor = isCursor;

function derefCursor(aCursor)
{
    const rootCursor = aCursor.rootCursor;

    if (rootCursor === aCursor)
        return aCursor.object;

    const rootObject = rootCursor.object;
    
    if (aCursor.cachedRoot === rootObject)
        return aCursor.cachedDeref;

    aCursor.cachedRoot = rootObject;

    const parentValue = derefCursor(aCursor.parent);
        
    if (aCursor.cachedParentValue === parentValue)
        return aCursor.cachedDeref;

    aCursor.cachedParentValue = parentValue;
    
    return aCursor.cachedDeref = parentValue === missing ? missing : parentValue.get(aCursor.key, missing);
}

function deref(aCursorOrObject, aDefaultValue)
{
    if (!isCursor(aCursorOrObject))
        return aCursorOrObject === undefined && arguments.length > 1 ? aDefaultValue : aCursorOrObject;

    const value = derefCursor(aCursorOrObject);

    if (value === missing && arguments.length < 2)
        throw new Error("Could not dereference cursor at " + aCursorOrObject.keyPath);

    return value !== missing ? value : aDefaultValue;
}

module.exports.deref = deref;

//    return Cursor.deref(Cursor.refine(aCursorOrObject, aKeyPath), aDefaultValue);
function derefIn(aCursorOrObject, aKeyPath, aDefaultValue)
{
    const value = deref(aCursorOrObject, missing);
    const hasDefaultValue = arguments.length >= 3;

    if (value === missing)
        if (!hasDefaultValue)
            throw new Error("Could not dereference cursor at [" + aCursorOrObject + "] ++ [" + aKeyPath + "]");
        else
            return aDefaultValue;

    const getter = isArray(aKeyPath) || isIterable(aKeyPath) ? "getIn" : "get";
    const secondValue = value[getter](aKeyPath, missing);

    if (secondValue === missing)
        if (!hasDefaultValue)
            throw new Error("Could not dereference cursor at [" + aCursorOrObject + "] ++ [" + aKeyPath + "]");
        else
            return aDefaultValue;

    return secondValue;
}

module.exports.deref.in = derefIn;

module.exports.setDefault = function setDefault(aCursorOrObject, aDefaultValue)
{
    if (!isCursor(aCursorOrObject))
        return aCursorOrObject === undefined && arguments.length > 1 ? aDefaultValue : aCursorOrObject;

    if (!exists(aCursorOrObject))
        return set(aCursorOrObject, aDefaultValue);

    return derefCursor(aCursorOrObject);
}

module.exports.refine = function refine(aCursorOrObject, aKeyPath)
{
    if (!isCursor(aCursorOrObject))
        return derefIn(aCursorOrObject, aKeyPath);

    if (isArray(aKeyPath) || isIterable(aKeyPath))
        return aKeyPath.reduce(Cursor, aCursorOrObject);

    return Cursor(aCursorOrObject, aKeyPath);
}

module.exports.remove = function remove(aCursorOrObject)
{
    Cursor.removeIn(aCursorOrObject, []);
}

function removeIn(aCursorOrObject, aKeyPath)
{
    if (!isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    const rootObject = aCursorOrObject.rootCursor.object;

    aCursorOrObject.rootCursor.object = rootObject.removeIn(aCursorOrObject.keyPath.concat(aKeyPath));
}

module.exports.remove.in = removeIn;

module.exports.update = function update(aCursorOrObject, aDefaultValue, aFunction)
{
    if (!isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    const rootObject = aCursorOrObject.rootCursor.object;

    aCursorOrObject.rootCursor.object = rootObject.updateIn(aCursorOrObject.keyPath, aDefaultValue, aFunction);
}

module.exports.update.in = function updateIn(aCursorOrObject, aKeyPath, aDefaultValue, aFunction)
{
    if (!isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    const rootObject = aCursorOrObject.rootCursor.object;
    const keyPath = aCursorOrObject.keyPath.concat(aKeyPath);

    aCursorOrObject.rootCursor.object = rootObject.updateIn(keyPath, aDefaultValue, aFunction);
}

function set(aCursorOrObject, aValue)
{
    if (!isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    const rootObject = aCursorOrObject.rootCursor.object;

    aCursorOrObject.rootCursor.object = rootObject !== null ?
        rootObject.setIn(aCursorOrObject.keyPath, aValue) : aValue;

    return aValue;
};

module.exports.set = set;

function setIn(aCursorOrObject, aKeyPath, aValue)
{
    if (!isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    const rootObject = aCursorOrObject.rootCursor.object;
    const keyPath = aCursorOrObject.keyPath.concat(aKeyPath);

    aCursorOrObject.rootCursor.object = rootObject.setIn(keyPath, aValue);

    return aValue;
}

module.exports.set.in = setIn;

module.exports.invert = function(aCursorOrObject)
{
    return set(aCursorOrObject, !deref(aCursorOrObject));
}

module.exports.invert.in = function(aCursorOrObject, aKeyPath)
{
    return setIn(aCursorOrObject, aKeyPath, !derefIn(aCursorOrObject, aKeyPath));
}

function exists(aCursorOrObject)
{
    return deref(aCursorOrObject, missing) !== missing;
}

module.exports.exists = exists;

function existsIn(aCursorOrObject, aKeyPath)
{
    return derefIn(aCursorOrObject, aKeyPath, missing) !== missing;
}

module.exports.existsIn = existsIn;
