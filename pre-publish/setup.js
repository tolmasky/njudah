
var path = require("path");
var oldResolveLookupPaths = require("module")._resolveLookupPaths;

require("module")._resolveLookupPaths = function(request, parent)
{
    var result = oldResolveLookupPaths(request, parent);

    return [result[0], result[1].concat(path.join(__dirname, "node_modules"), path.dirname(path.dirname(__dirname)))];
}

require("babel-register")(Object.create(require("./babel-settings"),
{
    ignore:
    {
        value: "**/node_modules",
        configurable: true
    }
}));
