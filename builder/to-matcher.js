
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);

const micromatch = require("micromatch");

const ArrayMap = Array.prototype.map;
const isArray = Array.isArray;
const ArraySome = Array.prototype.some;

const I = require("immutable");
const isList = I.List.isList;

module.exports = function toMatcher(...args)
{
    return toFunction(args);
}

function toFunction(aMatch)
{
    if (isArray(aMatch))
    {
        const asFunctions = Call(ArrayMap, aMatch, toFunction);

        return aPath => Call(ArraySome, asFunctions, aMatch => aMatch(aPath));
    }

    if (isList(aMatch))
    {
        const asFunctions = aMatch.map(toFunction);

        return aPath => asFunctions.some(aMatch => aMatch(aPath));
    }

    if (typeof aMatch === "string")
    {
        const matcher = new micromatch.matcher(aMatch);
    
        return aPath => matcher(aPath);
    }

    if (typeof aMatch === "function")
        return aMatch;

    return () => false;
}
