
const { lstat } = require("fs");

module.exports = function (aPath)
{
    return new Promise(function (resolve, reject)
    {
        lstat(aPath, function (err, result)
        {
            if (err)
                return reject(err);

            resolve(result);
        });
    });
}