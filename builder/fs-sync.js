
const { execSync } = require("child_process");
const { internalModuleStat } = process.binding("fs");
const { readdirSync, readFileSync, copyFileSync, writeFileSync } = require("fs");

module.exports.write = function({ path, contents, encoding })
{
    return writeFileSync(path, contents, encoding);
}

module.exports.copy = function({ source, destination })
{
    return copyFileSync(source, destination);
}

module.exports.read = function read({ path, encoding })
{
    return readFileSync(path, encoding);
}

module.exports.readdir = function readdir({ path })
{
    return readdirSync(path);
}

module.exports.mkdirp = function mkdirp({ path })
{
    execSync(`mkdir -p ${JSON.stringify(path)}`);
}

module.exports.tstat = function tstat({ path })
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