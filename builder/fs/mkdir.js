

const { lstat, mkdir } = require("fs");

const mkdirp = require("mkdirp");

//module.exports = function ({ source, state, destination, completed })
//{
//    const result = mkdirSafe.await(refine(state, "mkdir"), { destination });
//    const result = refine(state, "mkdir").byCalling(mkdir, { destination });
//
//    if (result)
//        set(completed, true);
//
//    return <Node destination = { destination } completed = { !!result } />;
//}

module.exports = function mkdirSafe({ destination })
{
    return new Promise(function (resolve, reject)
    {
        lstat(destination, function (err)
        {
            if (!err)
                return resolve(true);

            mkdir(destination, function (err)
            {
                if (err)
                    return reject(err);
                
                resolve(true);
            });
        });
    });
}

module.exports.p = function (destination)
{
    return new Promise(function (resolve, reject)
    {
        mkdirp(destination, function (err, result)
        {
            if (err)
                return reject(err);

            resolve(destination);
        });
    })
}
