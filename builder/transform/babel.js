
const transform = require("babel-core").transform;

module.exports = function babel({ contents, options })
{
    return transform(contents, options).code;
}
