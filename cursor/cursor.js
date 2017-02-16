
var I = require("immutable");


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

Cursor.prototype.deref = function()
{
    if (this.rootCursor === this)
        return this.object;

    if (this.cachedRoot !== this.rootCursor.object)
    {
        this.cachedRoot = this.rootCursor.object;

        var parentValue = this.parent.deref();
        
        if (this.cachedParentValue !== parentValue)
        {
            this.cachedDeref = parentValue === missing ? missing : parentValue.get(this.key, missing);
            this.cachedParentValue = parentValue;
        }
    }

    return this.cachedDeref;
}

Cursor.isCursor = function(aCursorOrObject)
{
    return aCursorOrObject instanceof Cursor;
}

Cursor.deref = function(aCursorOrObject, aDefaultValue)
{
    if (!Cursor.isCursor(aCursorOrObject))
        return aCursorOrObject === undefined && arguments.length > 1 ? aDefaultValue : aCursorOrObject;

    var value = aCursorOrObject.deref();

    if (value === missing && arguments.length < 2)
        throw new Error("Could not dereference cursor at " + aCursorOrObject.keyPath);

    return value !== missing ? value : aDefaultValue;
}

Cursor.default = function(aCursorOrObject, aDefaultValue)
{
    if (!Cursor.isCursor(aCursorOrObject))
        return aCursorOrObject === undefined && arguments.length > 1 ? aDefaultValue : aCursorOrObject;

    if (!Cursor.exists(aCursorOrObject))
    {
        Cursor.set(aCursorOrObject, aDefaultValue);

        return aDefaultValue;
    }

    return Cursor.deref(aCursorOrObject);
}

//    return Cursor.deref(Cursor.refine(aCursorOrObject, aKeyPath), aDefaultValue);
Cursor.derefIn = function(aCursorOrObject, aKeyPath, aDefaultValue)
{
    var value = Cursor.deref(aCursorOrObject, missing);

    if (value === missing)
        if (arguments.length < 3)
            throw new Error("Could not dereference cursor at [" + aCursorOrObject.keyPath + "] ++ [" + aKeyPath + "]");
        else
            return aDefaultValue;

    if (Array.isArray(aKeyPath) || I.Iterable.isIterable(aKeyPath))
        return value.getIn(aKeyPath, aDefaultValue);
try {
    return value.get(aKeyPath, aDefaultValue); } catch(e) { console.log("OK " + aKeyPath); throw e}

}

Cursor.refine = function(aCursorOrObject, aKeyPath)
{
    if (!Cursor.isCursor(aCursorOrObject))
        return Cursor.derefIn(aCursorOrObject, aKeyPath);

    if (Array.isArray(aKeyPath) || I.Iterable.isIterable(aKeyPath))
        return aKeyPath.reduce(Cursor, aCursorOrObject);

    return Cursor(aCursorOrObject, aKeyPath);
}

Cursor.refineDefault = function(aCursorOrObject, aKeyPath, aDefaultValue)
{
   var cursor = Cursor.refine(aCursorOrObject, aKeyPath);

   Cursor.default(cursor, aDefaultValue);
   return cursor;
};

Cursor.remove = function(aCursorOrObject)
{
    Cursor.removeIn(aCursorOrObject, []);
}

Cursor.removeIn = function(aCursorOrObject, aKeyPath)
{
    if (!Cursor.isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    var rootObject = aCursorOrObject.rootCursor.object;

    aCursorOrObject.rootCursor.object = rootObject.removeIn(aCursorOrObject.keyPath.concat(aKeyPath));
}

Cursor.update = function(aCursorOrObject, aDefaultValue, aFunction)
{
    if (arguments.length > 2)
        return Cursor.updateIn(aCursorOrObject, [], aDefaultValue, aFunction);

    return Cursor.updateIn(aCursorOrObject, [], aDefaultValue);
}

Cursor.updateIn = function(aCursorOrObject, aKeyPath, aDefaultValue, aFunction)
{
    if (!Cursor.isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    var rootObject = aCursorOrObject.rootCursor.object;

    aCursorOrObject.rootCursor.object = rootObject.updateIn(aCursorOrObject.keyPath.concat(aKeyPath), aDefaultValue, aFunction);
}

Cursor.setIn = function(aCursorOrObject, aKeyPath, aValue)
{
    if (!Cursor.isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    var rootObject = aCursorOrObject.rootCursor.object;

    aCursorOrObject.rootCursor.object = rootObject.setIn(aCursorOrObject.keyPath.concat(aKeyPath), aValue);
}

Cursor.set = function(aCursorOrObject, aValue)
{
    if (!Cursor.isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    var rootObject = aCursorOrObject.rootCursor.object;

    aCursorOrObject.rootCursor.object = rootObject !== null ? rootObject.setIn(aCursorOrObject.keyPath, aValue) : aValue;
    
    return aValue;
};

Cursor.invert = function(aCursorOrObject)
{
    Cursor.set(aCursorOrObject, !Cursor.deref(aCursorOrObject));
}

Cursor.invertIn = function(aCursorOrObject, aKeyPath)
{
    Cursor.setIn(aCursorOrObject, aKeyPath, !Cursor.derefIn(aCursorOrObject, aKeyPath));
}

Cursor.exists = function(aCursorOrObject)
{
    return Cursor.deref(aCursorOrObject, missing) !== missing;
}

Cursor.existsIn = function(aCursorOrObject, aKeyPath)
{
    return Cursor.derefIn(aCursorOrObject, aKeyPath, missing) !== missing;
}

Cursor.setUndoAction = function(aCursor, aTitle)
{
    return Cursor.setIn(aCursor, "undoAction", I.Map({title: aTitle, timestamp: (new Date()).getTime()}))
}

Cursor.map = function(aFunction, aCursorOrObject)
{
    var object = Cursor.deref(aCursorOrObject);

    return object.map(function(_, aKey)
    {
        return aFunction(Cursor.refine(aCursorOrObject, aKey), aKey);
    });
};

Cursor.filter = function(aFunction, aCursorOrObject)
{
    var object = Cursor.deref(aCursorOrObject);

    return object.filter(function(_, aKey)
    {
        return aFunction(Cursor.refine(aCursorOrObject, aKey), aKey);
    });
};


Cursor.falsify = function(aCursorOrObject)
{
    return Cursor.falsifyIn(aCursorOrObject, []);
}

Cursor.falsifyIn = function(aCursorOrObject, aKeyPath)
{
    if (!Cursor.isCursor(aCursorOrObject))
        throw new Error("Immutable value used as updatable cursor " + aCursorOrObject);

    Cursor.setIn(aCursorOrObject, aKeyPath, false);
}

module.exports = Cursor;
