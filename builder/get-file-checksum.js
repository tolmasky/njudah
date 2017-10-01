
const getChecksum = require("@njudah/get-checksum");
const { readFileSync } = require("fs");

module.exports = function getFileChecksum(aPath)
{
    return getChecksum(readFileSync(aPath));
}


/*function getFileChecksum(aPath)
{
    return new Promise(function (resolve, reject)
    {
        readFile(aPath, function (err, data)
        {
            if (err)
                return reject(err);
    
            resolve(getChecksum(data));
        });
    });
}*/
