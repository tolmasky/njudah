

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
                plugins: plugins.map(aPlugin => resolvePlugin(aPlugin)),
                presets: presets.map(aPreset => resolvePreset(aPreset))
            };
}

async function getChecksummableOptions(options)
{
    const { presets = [], plugins = [], ...rest } = options;
    //const pathsToChecksums = await getPackageChecksum(Array.from(new Set(plugins.concat(presets))));
    /*const { presets = [], plugins = [], ...rest } = options;*/
    const pathsAndChecksums = Array.from(new Set(plugins.concat(presets)),
        async path => ({ [path]: await getPackageChecksum(path) }));
    const pathsToChecksums = (await Promise.all(pathsAndChecksums)).reduce(Object.assign, Object.create(null));


    return {
            ...rest,
                plugins: presets.map(aPlugin => pathsToChecksums[aPlugin]),
                presets: plugins.map(aPreset => pathsToChecksums[aPreset])
            };
}
