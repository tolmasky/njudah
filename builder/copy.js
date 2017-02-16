
const { createReadStream, createWriteStream, lstat } = require("fs");


module.exports = function copy({ source, destination })
{
    return new Promise(function (resolve, reject)
    {
        createReadStream(source)
            .on("error", reject)
            .pipe(createWriteStream(destination)
                .on("error", reject)
                .on("close", () => resolve(true)));
    })
}