
const { lstat, readdir } = require("fs");
const I = require("immutable");
const FileDescription = I.Record({ type: null, path:null, children: null }, "FileDescription");


module.exports = function getFileDescription(aPath)
{
    return new Promise(function (resolve, reject)
    {
        lstat(aPath, function (err, stat)
        {
            if (err)
                return reject(err);

            if (stat.isDirectory())
                return readdir(aPath, function (err, files)
                {
                    if (err)
                        return reject(err);

                    resolve(FileDescription({ type:"directory", path: aPath, children: I.List(files.map(aChildPath => require("path").join(aPath, aChildPath))) }));
                });

            resolve(new FileDescription({ type:"file", path: aPath }));
        });
    });
}