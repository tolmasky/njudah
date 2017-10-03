
const promisified = require("@njudah/cursor/promisified");


module.exports = function (aBuild)
{
    return promisified(toCurriedFunction(aBuild), function (aState)
    {
        return aState.tree.children[2].binding.attributes["destination"].value;
    });
}

function toCurriedFunction(anArray)
{
    if (typeof anArray === "function")
        return anArray;

    const [aFunction, attributes, ...children] = anArray;

    return require("generic-jsx").curry(aFunction, attributes, ...children.map(toCurriedFunction));
}