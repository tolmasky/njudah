
const { join } = require("path");
const { Map } = require("immutable");
const promisified = require("@njudah/cursor/promisified");


module.exports = function (aBuild)
{
    return promisified(toCurriedFunction(aBuild), function (aState)
    {
        const item = aState.tree.children[2].binding;
        const destination = item.attributes["destination"].value;
        const metadata = flatten("", item.attributes["metadata"].value);

        return { destination, metadata };
    });
}

function flatten(parent, metadata)
{
    return metadata.reduce(function (flattened, value, key)
    {
        if (!Map.isMap(value))
            return flattened.set(join(parent, key), value);

        return flattened.merge(flatten(join(parent, key), value));
    }, Map());
}

function toCurriedFunction(anArray)
{
    if (typeof anArray === "function")
        return anArray;

    const [aFunction, attributes, ...children] = anArray;

    return require("generic-jsx").curry(aFunction, attributes, ...children.map(toCurriedFunction));
}