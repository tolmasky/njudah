

const { dirname, basename } = require("path");
const { spawn } = require("child_process");

const platform = require("os").platform();
const shasum = platform === "darwin" ? "shasum -a 256" : "sha256sum";

module.exports = function getPackageSha256Sum(aPath)
{
    if (Array.isArray(aPath))
        return getPackagesSha256Sum(aPath);

    const directory = dirname(aPath);
    const name = basename(aPath);

    var string = "";

    return new Promise(function (resolve, reject)
    {
        spawn("sh", ["-c", `find ${name} -path "${name}/node_modules" -prune -o -not -name .DS_Store -type f -exec ${shasum} {} \\; | ${shasum}`], { cwd: directory })
            .on("close", () => resolve(string.substr(0, string.indexOf(" "))))
            .stdout.on("data", data => string += data + "");
    });
}

function getPackagesSha256Sum(paths)
{
    const commands = paths.map(function (aPath)
    {
        const directory = dirname(aPath);
        const name = basename(aPath);
        
        return `(cd ${directory}; find ${name} -path "${name}/node_modules" -prune -o -not -name .DS_Store -type f -exec ${shasum} {} \\; | ${shasum} | xargs echo ${aPath})`;
    });

    var string = "";

    return new Promise(function (resolve, reject)
    {
        spawn("sh", ["-c", commands.join(" & ")])
            .on("close", () => resolve(parse(string)))
            .stdout.on("data", data => string += data + "");
    });
}

function parse(aString)
{
    return aString.split("\n").reduce(function (lhs, line)
    {
        if (line.length <= 0)
            return lhs;
        
        const key = line.substr(0, line.length - 64 - 2 - 1);
        const value = line.substr(line.length - 64 - 2, 64);
        
        return Object.assign(lhs, { [key]: value });
    }, Object.create(null));
}
