
const { writeFile } = require("fs");


module.exports = function writeFile_({ contents, destination = "p", charset = "utf-8" })
{
    return new Promise(function (resolve, reject)
    {
        writeFile(destination, contents, charset, function (err)
        {
            if (err)
                return reject(err);

            resolve(destination);
        });
    })
}