
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);

const { join, basename, extname } = require("path");

const readFile = require("./fs/read-file");
const lstat = require("./fs/lstat");
const writeFile = require("./fs/write-file");
const { getArguments } = require("generic-jsx");

const getChecksum = require("@njudah/get-checksum");
const toMatcher = require("./to-matcher");

const isArray = Array.isArray;
const ArrayMap = Array.prototype.map;


function transform({ source, cache, checksum, children:[aFunction] })
{
    const extension = extname(source);
    const contentsPath = join(cache, basename(source, extension) + "-" + checksum + extension);
    const metadataPath = join(cache, basename(source, extension) + "-" + checksum + extension + ".metadata.json");

    return Promise.all([lstat(contentsPath), readFile({ source: metadataPath }).then(JSON.parse)])
        .then(([_, metadata]) => ({ contentsPath, metadata }))
        .catch(function (e)
        {
            return readFile({ source })
                .then(function (contents)
                {
                    console.log("TRANSFORMING " + source);

                    return aFunction({ contents })
                })
                .then(function (transformed)
                {
                    const contents = typeof transformed === "string" ? transformed : transformed.contents;
                    const metadata = typeof transformed === "string" ? { } : transformed.metadata;
    
    
                    return Promise.all([
                        writeFile({ destination: contentsPath, contents }),
                        writeFile({ destination: metadataPath, contents: JSON.stringify(metadata) })
                    ])
                        .then(() => ({ contentsPath, metadata }));
                });
        })
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

            return { transform, checksum: getChecksum(JSON.stringify(attributes)) };
        }
    }
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
