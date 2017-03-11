
const path = require("path");

const Module = require("module");
const oldResolveLookupPaths = Module._resolveLookupPaths;
const packages = path.dirname(path.dirname(__dirname));


Module._resolveLookupPaths = function(request, parent)
{
    const result = oldResolveLookupPaths(request, parent);

    return [result[0], result[1].concat(path.join(__dirname, "node_modules"), packages)];
}

const babelSettings = require("./babel-settings");

module.exports = function (options)
{
    const babelRegister = options.babelRegister || false;

    if (babelRegister)
        require("babel-register")(Object.create(babelSettings,
        {
            ignore:
            {
                value: "**/node_modules",
                configurable: true
            }
        }));
}
