
const { join } = require("path");
const { lstat: lstat_native } = require("bindings")("fast-fs");
const fs = require("fs");
const mkdirp_ = require("mkdirp");

module.exports.lstat = function lstat(aPath)
{
    return new Promise(function (resolve, reject)
    {
        lstat_native(aPath, resolve);
    });
}

module.exports.readdir = function readdir(aPath)
{
    return new Promise(function (resolve, reject)
    {
        fs.readdir(aPath, function(err, result)
        {
            if (err)
                return reject(err);
            
            resolve(result.map(aChild => join(aPath, aChild)));
        });
    });
}

module.exports.readFile = function readFile(...args)
{
    return new Promise(function (resolve, reject)
    {
        fs.readFile(...args, function (err, result)
        {
            if (err)
                return reject(err);

            resolve(result);
        });
    });
}

module.exports.writeFile = function writeFile(...args)
{
    return new Promise(function (resolve, reject)
    {
        fs.writeFile(...args, function (err, result)
        {
            if (err)
                return reject(err);

            resolve(result);
        });
    });
}

module.exports.mkdir = function mkdir({ destination })
{
    return new Promise(function (resolve, reject)
    {
        fs.mkdir(destination, function (err)
        {
            resolve(destination);
        });
    });
}

module.exports.mkdir.p = function mkdirp(destination)
{
    return new Promise(function (resolve, reject)
    {
        mkdirp_(destination, function (err, result)
        {
            if (err)
                return reject(err);

            resolve(destination);
        });
    });
/*    return new Promise(function (resolve, reject)
    {
        spawn("mkdir", ["-p", destination])
            .on("close", () => resolve(destination))
            .on("error", error => reject(error));
    });
*/
}
