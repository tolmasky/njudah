
const { createReadStream, createWriteStream, lstat } = require("fs");


module.exports = function copy({ source, destination })
{
    return new Promise(function (resolve, reject)
    {console.log("COPYING " + destination);
        createReadStream(source)
            .on("error", reject)
            .pipe(createWriteStream(destination)
                .on("error", reject)
                .on("close", () => resolve(true)));
    })
}