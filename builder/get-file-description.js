
const { lstat } = require("@njudah/fast-fs");
const { readdirSync } = require("fs");
const I = require("immutable");
const FileDescription = I.Record({ type: null, path:null, children: null }, "FileDescription");


module.exports = function getFileDescription(aPath)
{
    return lstat(aPath)
        .then(function (stat)
        {
            if (stat === 1)
            {
                const files = readdirSync(aPath);

                return FileDescription({ type:"directory", path: aPath, children: I.List(files.map(aChildPath => require("path").join(aPath, aChildPath))) });
            }
    
            return new FileDescription({ type:"file", path: aPath });
        });
}