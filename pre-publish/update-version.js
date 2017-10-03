

const { basename, join } = require("path");
const { readdir, tstat, write } = require("../builder/fs-sync");
const stringify = object => JSON.stringify(object, null, 2);

const PathSymbol = Symbol("path");

const { version } = require("commander")
    .option("--version [version]", "version")
    .parse(process.argv);

const packages = readdir({ path: ".." })
    .map(path => join(__dirname, "..", path))
    .filter(path => basename(path).charAt(0) !== "." && tstat({ path }) === "directory")
    .map(path => join(path, "package.json"));

const upgrades = packages
    .map(path => ({ [PathSymbol]: path, ...require(path) }))
    .map(properties => Object.assign(
        { ...properties, version },
        upgradeDependencies(properties, "dependencies"),
        upgradeDependencies(properties, "peerDependencies")))
    .map(properties => [properties[PathSymbol], stringify(properties)])

for ([path, contents] of upgrades)
    write({ path, contents, encoding: "utf-8" });

function upgradeDependencies(aPackageJSON, aKey)
{
    if (!aPackageJSON[aKey])
        return;

    const dependencies = aPackageJSON[aKey];
    const names = Object.keys(dependencies);

    return { [aKey]: names.reduce((accumulator, key) =>
        Object.assign(accumulator, { [key]: key.indexOf("@njudah/") === 0 ? version : dependencies[key] }), { }) };
}