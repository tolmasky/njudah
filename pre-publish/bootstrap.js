
const path = require("path");

const Module = require("module");
const oldResolveLookupPaths = Module._resolveLookupPaths;
const packages = path.dirname(path.dirname(__dirname));


Module._resolveLookupPaths = function(request, parent, newReturn)
{
    const result = oldResolveLookupPaths.apply(this, arguments);

    if (newReturn)
        return (result || []).concat(path.join(__dirname, "node_modules"), packages);

    return [result[0], result[1].concat(path.join(__dirname, "node_modules"), packages)];
}

const babelSettings = require("./babel-settings");

module.exports = function (options)
{
    const babelRegister = options.babelRegister || false;

    if (babelRegister)
        require("babel-register")(babelSettings);
}
