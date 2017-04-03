
const path = require("path");

const { lstat, readdir, mkdir, copy } = require("@njudah/fast-fs");

const getChecksum = require("@njudah/get-checksum");
const getFileChecksum = require("./get-file-checksum");

const { transform, find: findTransform } = require("./transform");
const { refine, deref, set, exists, stem } = require("@njudah/cursor");

const id = x => x;
const toMatcher = require("./to-matcher");
var time = require("@njudah/cursor/time");

module.exports = Build;
module.exports.build = Build;
module.exports.transform = transform;

function Build({ source, destination, state, children = [], ignore })
{
    const checksum = refine(state, "checksum");
    const checksumValue = deref(checksum, false);

    const cachePath = path.join(destination, "cache");
    const productPath = checksumValue && path.join(destination, checksumValue, path.extname(source));
    const ignoreMatcher = toMatcher.memoizedCall(refine(state, "ignore"), ignore, destination, "**/.*");

    return <Item    source = { source }
                    state = { refine(state, "item") }
                    transforms = { transform.optimize.await(refine(state, "optimize"), children) }
                    checksum = { checksum }
                    ignore = { ignoreMatcher }
                    cache = { mkdir.p.await(refine(state, "cache"), cachePath) }
                    destination = { productPath && mkdir.p.await(refine(state, "product"), productPath) } />;
}

function Item({ source, state, ignore, checksum, ...rest })
{
    const ignored = refine(state, "ignored");

    if (exists(ignored) ? deref(ignored) : set(ignored, ignore(source)))
         return set(checksum, "ignored");

    const stat = lstat.await(refine(state, "lstat"), source);

    if (typeof stat !== "number")
        return;

    const Type = stat === 1 ? Directory : File;

    return <Type
                source = { source }
                ignore = { ignore }
                checksum = { checksum }
                { ...rest }
                state = { refine(state, "type") } />;
}

function File({ source, cache, checksum, transforms, state, destination })
{
    const fileChecksum = getFileChecksum.await(refine(state, "file-checksum"), source);

    if (!fileChecksum)
        return;

    const { transform, checksum: transformChecksum } = findTransform(source, transforms) || { };
    const checksumValue = set(checksum, getChecksum(JSON.stringify({ transformChecksum, fileChecksum })));

    set(checksum, checksumValue);

    const artifactPath = transform ? path.join(cache, set(checksum, checksumValue) + path.extname(source)) : source;
    const transformed = !transform || transform.await(refine(state, "transformed"), { source, destination: artifactPath });
    const copied = transformed && destination && copy.await(refine(state, "copy"), { source: artifactPath, destination });

    return copied ? "copied" : "incomplete";
}

function Directory({ source, destination, cache, checksum, transforms, ignore, state })
{
    const files = readdir.await(refine(state, "files"), source);

    if (!files || !transforms)
        return <stem/>;

    const checksumValue = deref(checksum, false) === false && 
        files.every(aPath => deref.in(state, aPath + "-checksum", false)) &&
        set(checksum, getChecksum(...files.map(aPath => deref.in(state, aPath + "-checksum", false))));

    const completed = destination && mkdir.await(refine(state, "mkdir"), { destination });

    return  <stem path = { source } checksum = { checksumValue } >
            {
                files.map(aPath =>
                    <Item
                        source = { aPath }
                        ignore = { ignore }
                        checksum = { refine(state, aPath + "-checksum") }
                        transforms = { transforms } 
                        state = { refine(state, aPath) }
                        cache = { cache }
                        destination = { completed && path.join(destination, path.basename(aPath)) } />)
            }
            </stem>;
}

