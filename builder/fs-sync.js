
const { execSync } = require("child_process");
const { internalModuleStat } = process.binding("fs");
const { readdirSync, readFileSync, copyFileSync } = require("fs");

module.exports.copy = function({ source, destination })
{
    return copyFileSync(source, destination);
}

module.exports.read = function({ path, encoding })
{
    return readFileSync(path, encoding);
}

module.exports.readdir = function ({ path })
{
    return readdirSync(path);
}

module.exports.mkdirp = function ({ path })
{
    execSync(`mkdir -p ${JSON.stringify(path)}`);
}

module.exports.tstat = function ({ path })
{
    const type = internalModuleStat(path);

    if (type < 0)
        return "ENOENT";

    if (type === 0)
        return "file";

    if (type === 1)
        return "directory";

    throw new Error("Unknown Error");
}