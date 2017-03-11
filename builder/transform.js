
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);

const { readFile, writeFile, lstat } = require("fs");
const { base, getArguments } = require("generic-jsx");

const getChecksum = require("@njudah/get-checksum");
const toMatcher = require("./to-matcher");

const isArray = Array.isArray;
const isList = require("immutable").List.isList;
const ArrayMap = Array.prototype.map;


function transform({ source, destination, children:[aFunction] })
{
    return new Promise(function (resolve, reject)
    {
        lstat(destination, function (err)
        {
            if (!err)
            {
//                console.log("SKIPPING " + source);
                return resolve(destination);
            }
            
            console.log("TRANSFORMING " + source);
            
            readFile(source, "utf-8", function (err, contents)
            {
                if (err)
                    return reject(err);
    
                Promise.resolve(aFunction({ contents }))
                    .then(function (transformed)
                    {
                        return writeFile(destination, transformed, "utf-8", function (err)
                        {
                            if (err){console.log(err);
                                return reject(err);}
    
                            resolve(destination);
                        });
                    });
            });
        });
    });
}


module.exports = transform;
module.exports.transform = transform;

function find (aPath, transforms)
{
    for (const transform of transforms)
    {
        const props = getArguments(transform);

        if (!toMatcher(props.ignore)(aPath) && toMatcher(props.match)(aPath))
        {
            const { children:[child] } = getArguments(transform);
            const { children, ...attributes } = getArguments(child);

            return { transform, checksum: attributes.checksum || getChecksum(JSON.stringify(attributes)) };
        }
    }
}

module.exports.optimize = function optimize(aTransform)
{
    if (isArray(aTransform) || isList(aTransform))
        return aTransform.map(aTransform => optimize(aTransform));

    const { children:[child] } = getArguments(aTransform);
    const { optimize: optimization } = base(child);
    
    if (!optimization)
        return aTransform;

    return <aTransform>
             { optimization(child) }
            </aTransform>;
}

module.exports.find = find;

function merge(transforms, attributes)
{
    return Call(ArrayMap, transforms || [], function (transform)
    {
        const { transformMatch, transformIgnore } = getArguments(transforms);
        const mergedMatch = match.merge(attributes.match, transformMatch);
        const mergedIgnore = match.merge(attributes.ignore, transformIgnore);

        return <transform { ...mergedMatch } { ...mergedIgnore } />;
    });
}

module.exports.merge = merge;
