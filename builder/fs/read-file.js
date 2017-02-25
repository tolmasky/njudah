
const { readFile } = require("fs");


module.exports = function ({ source, charset = "utf-8" })
{
    return new Promise(function (resolve, reject)
    {
        readFile(source, charset, function (err, contents)
        {
            if (err)
                return reject(err);

            resolve(contents);
        });
    })
}