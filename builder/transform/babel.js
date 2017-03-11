
const { resolvePlugin, resolvePreset, transform } = require("babel-core");
const { getArguments } = require("generic-jsx");
const getChecksum = require("@njudah/get-checksum");


module.exports = function babel({ contents, options })
{
    return transform(contents, options).code;
}

module.exports.optimize = function (aBabel)
{
    const { children, ...attributes } = getArguments(aBabel);
    const checksum = getChecksum(JSON.stringify(attributes));

    return <aBabel options = { resolvePluginsAndPresets(getArguments(aBabel).options) } checksum = { checksum } />;
}

function resolvePluginsAndPresets({ plugins = [], presets = [], ...rest })
{
    return {
                ...rest,
                plugins: plugins.map(aPlugin => require(resolvePlugin(aPlugin))),
                presets: presets.map(aPreset => require(resolvePreset(aPreset)))
            }
}