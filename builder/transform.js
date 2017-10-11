
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);

const { base, getArguments } = require("generic-jsx");

const getChecksum = require("@njudah/get-checksum");
const toMatcher = require("./to-matcher");

const isArray = Array.isArray;
const isList = require("immutable").List.isList;
const ArrayMap = Array.prototype.map;

const { basename, dirname, join } = require("path");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { write, mkdirp, tstat, read } = require("./fs-sync");
const { parse, stringify } = JSON;

function transform({ source, root, contents, destination, children:[aFunction] })
{
    const encoding = "utf-8"
    const transformedPath = join(destination + "-contents.js");
    const metadataPath = join(destination + "-metdata.json");

    if (tstat({ path: transformedPath }) !== "ENOENT")
        return { transformedPath, metadata: getMetadata(metadataPath) };

    console.log("TRANSFORMING " + source);

    const { contents: transformedContents, metadata } =
        aFunction({ contents, source, root });
    const metadataContents = !!metadata && stringify(metadata, null, 2);

    write({ path: transformedPath, contents: transformedContents, encoding });

    if (metadata)
        write({ path: metadataPath, contents: metadataContents, encoding });

    return { transformedPath, metadata };
}

function getMetadata(path)
{
    if (tstat({ path }) === "ENOENT")
        return undefined;

    return parse(read({ path, encoding: "utf-8" }))
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
