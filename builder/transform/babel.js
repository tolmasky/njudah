

const { getArguments } = require("generic-jsx");
const getChecksum = require("@njudah/get-checksum");
const getPackageChecksum = require("@njudah/get-package-checksum");

const { dirname } = require("path");

module.exports = function babel({ contents, options })
{
    return require("babel-core").transform(contents, options).code;
}

module.exports.optimize = async function (aBabel)
{
    const { children, options = { }, ...rest } = getArguments(aBabel);
    const optionsWithResolvedPluginsAndPresets = getOptionsWithResolvedPluginsAndPresets(options);
    const checksummableAttributes =
    {
        ...rest,
        options: await getChecksummableOptions(optionsWithResolvedPluginsAndPresets)
    };

    const checksum = getChecksum(JSON.stringify(checksummableAttributes));

    return <aBabel options = { optionsWithResolvedPluginsAndPresets } checksum = { checksum } />;
}

function getOptionsWithResolvedPluginsAndPresets({ plugins = [], presets = [], ...rest })
{
    const resolvePlugin = plugins.length && require("babel-core/lib/helpers/resolve-plugin");
    const resolvePreset = presets.length && require("babel-core/lib/helpers/resolve-preset");

    return  {
                ...rest,
                plugins: plugins.map(aPlugin => resolve(resolvePlugin, aPlugin)),
                presets: presets.map(aPreset => resolve(resolvePreset, aPreset))
            };
}

function resolve(resolver, aPlugin)
{
    if (Array.isArray(aPlugin))
        return [resolver(aPlugin[0]), aPlugin[1]];
    
    return resolver(aPlugin);
}

async function getChecksummableOptions(options)
{
    const { presets = [], plugins = [], ...rest } = options;
    const getPath = aPlugin => !Array.isArray(aPlugin) ? aPlugin : aPlugin[0];

    const pathsAndChecksums = Array.from(new Set(plugins.map(getPath).concat(presets.map(getPath))),
        async path => ({ [path]: await getPackageChecksum(path) }));
    const pathsToChecksums = (await Promise.all(pathsAndChecksums)).reduce(Object.assign, Object.create(null));


    return {
            ...rest,
                plugins: presets.map(aPlugin => pathsToChecksums[aPlugin]),
                presets: plugins.map(aPreset => pathsToChecksums[aPreset])
            };
}
