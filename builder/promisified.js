
const promisified = require("@njudah/cursor/promisified");


module.exports = function (aBuild)
{
    return promisified(toCurriedFunction(aBuild), function (aState)
    {
        return aState.getIn(["attributes", "destination"]) + "/" + aState.getIn(["attributes", "state", "checksum"]);
    });
}

module.exports.withState = function (aBuild)
{
    return promisified(toCurriedFunction(aBuild), function (aState)
    {
        return [aState.getIn(["attributes", "destination"]) + "/" + aState.getIn(["attributes", "state", "checksum"]), aState];
    });
}

function toCurriedFunction(anArray)
{
    if (typeof anArray === "function")
        return anArray;

    const [aFunction, attributes, ...children] = anArray;

    return require("generic-jsx").curry(aFunction, attributes, ...children.map(toCurriedFunction));
}