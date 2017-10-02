
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);

const { lstat, readFile, writeFile } = require("@njudah/fast-fs");
const { base, getArguments } = require("generic-jsx");

const getChecksum = require("@njudah/get-checksum");
const toMatcher = require("./to-matcher");

const isArray = Array.isArray;
const isList = require("immutable").List.isList;
const ArrayMap = Array.prototype.map;

const { basename, dirname, join } = require("path");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { write, mkdirp, tstat } = require("./fs-sync");
const { stringify } = JSON;

function transform({ source, contents, destination, children:[aFunction] })
{
    const transformedPath = join(destination + "-transformed.js");
    const metadataPath = join(destination + "-metdata.json");

    if (tstat({ path: transformedPath }) !== "ENOENT")
        return { transformedPath, metadataPath };

//    mkdirp({ path: destination });

    const encoding = "utf-8"
    const transformed = aFunction({ contents, source });

    console.log("TRANSFORMING TO " + source);

    if (typeof transformed === "string")
        write({ path: transformedPath, contents: transformed, encoding });
    
    else
    {
        const { contents, metadata } = transformed;

        write({ path: transformedPath, contents, encoding });

        if (metadata)
            write({ path: metadataPath, contents: stringify(metadata, null, 2), encoding });
    }

    return { transformedPath, metadataPath };
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

module.exports.optimize = async function optimize(aTransform)
{
    if (isArray(aTransform) || isList(aTransform))
        return Promise.all(aTransform.map(aTransform => optimize(aTransform)));

    const { children:[child] } = getArguments(aTransform);
    const { optimize: optimization } = base(child);

    if (!optimization)
        return aTransform;

    return <aTransform>
             { await optimization(child) }
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
