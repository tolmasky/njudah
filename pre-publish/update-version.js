const path = require("path");
const version = process.argv[2];
const fs = require("fs");
const packages = fs.readdirSync("..")
    .map(aPath => path.join(__dirname, "..", aPath))
    .filter(aPath => path.basename(aPath).charAt(0) !== "." && fs.lstatSync(aPath).isDirectory());

const packageJSONs = packages.map(aPackagePath => require(path.join(aPackagePath, "package.json")));
const upgradedPackageJSONs = packageJSONs.map(aPackageJSON => Object.assign({ },
    aPackageJSON,
    { "version": version },
    upgradeDependencies(aPackageJSON, "dependencies"),
    upgradeDependencies(aPackageJSON, "peerDependencies")));

packages.forEach((aPath, anIndex) =>
    fs.writeFileSync(path.join(aPath, "package.json"), JSON.stringify(upgradedPackageJSONs[anIndex], null, 2), "utf-8"))

function upgradeDependencies(aPackageJSON, aKey)
{
    if (!aPackageJSON[aKey])
        return;

    const dependencies = aPackageJSON[aKey];
    const names = Object.keys(dependencies);

    return { [aKey]: names.reduce((accumulator, key) =>
        Object.assign(accumulator, { [key]: key.indexOf("@njudah/") === 0 ? version : dependencies[key] }), { }) };
}