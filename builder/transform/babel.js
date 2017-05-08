

const { getArguments } = require("generic-jsx");
const getChecksum = require("@njudah/get-checksum");
const getPackageChecksum = require("@njudah/get-package-checksum");

const { dirname } = require("path");

const isArray = Array.isArray;

module.exports = function babel({ contents, options, source })
{
    return require("babel-core").transform(contents, { ...options, filename: source }).code;
}

module.exports.optimize = async function (aBabel)
{
    const { children, options:{ pluginsSearchDirectory, ...options, } = { }, ...rest } = getArguments(aBabel);
    const optionsWithResolvedPluginsAndPresets = getOptionsWithResolvedPluginsAndPresets(options, pluginsSearchDirectory);
    const checksummableAttributes =
    {
        ...rest,
        options: await getChecksummableOptions(optionsWithResolvedPluginsAndPresets)
    };
    const checksum = getChecksum(JSON.stringify(checksummableAttributes));

    return <aBabel options = { optionsWithResolvedPluginsAndPresets } checksum = { checksum } />;
}

function getOptionsWithResolvedPluginsAndPresets({ plugins = [], presets = [], ...rest }, pluginsSearchDirectory)
{
    const resolvePlugin = plugins.length && require("babel-core/lib/helpers/resolve-plugin");
    const resolvePreset = presets.length && require("babel-core/lib/helpers/resolve-preset");

    return  {
                ...rest,
                plugins: plugins.map(aPlugin => (resolve(resolvePlugin, aPlugin, pluginsSearchDirectory))),
                presets: presets.map(aPreset => resolve(resolvePreset, aPreset, pluginsSearchDirectory))
            };
}

function resolve(resolver, aPlugin, pluginsSearchDirectory)
{
    if (Array.isArray(aPlugin))
        return [resolver(aPlugin[0], pluginsSearchDirectory), aPlugin[1]];

    return resolver(aPlugin, pluginsSearchDirectory);
}

async function getChecksummableOptions(options)
{
    const { presets = [], plugins = [], ...rest } = options;
    const getPath = aPlugin => !isArray(aPlugin) ? aPlugin : aPlugin[0];
    
    const pathsAndChecksums = Array.from(new Set(plugins.map(getPath).concat(presets.map(getPath))),
        async path => ({ [path]: await getPackageChecksum(path) }));
    const pathsToChecksums = (await Promise.all(pathsAndChecksums))
        .reduce((previous, anObject) => Object.assign(previous, anObject), Object.create(null));
    
    const getReplacedPath = aPlugin => isArray(aPlugin) ?
        [pathsToChecksums[aPlugin[0]], aPlugin[1]] :
        pathsToChecksums[aPlugin];

    return {
            ...rest,
                plugins: plugins.map(getReplacedPath),
                presets: presets.map(getReplacedPath)
            };
}
