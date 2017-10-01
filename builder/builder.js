
const path = require("path");

const { lstat, readdir, mkdir, copy } = require("@njudah/fast-fs");

const getChecksum = require("@njudah/get-checksum");
const getFileChecksum = require("./get-file-checksum");

const { transform, find: findTransform } = require("./transform");
const { refine, deref, set, exists, stem } = require("@njudah/cursor");

const { lstatSync, readFileSync, readdirSync, mkdirSync, existsSync, copyFileSync } = require("fs");
const stat = process.binding("fs").internalModuleStat;
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

    //const stat = lstatSync(source);//.memoizedCall(refine(state, "lstat"), source);
//    const stat = lstat.await(refine(state, "lstat"), source);

//    if (typeof stat !== "number")
//        return;

    //const stat = lstatSync(source);
    //const Type = stat.isDirectory() ? Directory : File;

    const type = stat.memoizedCall(refine(state, "lstat"), source)
    const Type = type === 1 ? Directory : File;
    //stat === 1 ? Directory : File;

    return <Type
                source = { source }
                ignore = { ignore }
                checksum = { checksum }
                { ...rest }
                state = { refine(state, "type") } />;
}

function File({ source, cache, checksum, transforms, state, destination })
{
    const { transform, checksum: transformChecksum } = findTransform(source, transforms) || { };
    const { contents, checksum: fileChecksum } =  getContentsAndChecksum
        .memoizedCall(refine(state, "file"), source, transform ? "utf-8" : undefined);
    const checksumValue = set(checksum, getChecksum(JSON.stringify({ transformChecksum, fileChecksum })));

    set(checksum, checksumValue);

    if (!destination)
        return "incomplete";

    const artifactPath = transform ? path.join(cache, set(checksum, checksumValue) + path.extname(source)) : source;
    const transformed = !transform || transform({ source, contents, destination: artifactPath })

    copyFileSync(artifactPath, destination);

    return "copied";
}

function getContentsAndChecksum(source, format)
{
    const contents = readFileSync(source, format);

    return { contents, checksum: getChecksum(contents) }
}

function Directory({ source, destination, cache, checksum, transforms, ignore, state })
{
    //readdir.await(refine(state, "files"), source);
    const files = readdirSync(source).map(name => path.join(source, name));

    if (!files || !transforms)
        return <stem/>;

    const checksumValue = deref(checksum, false) === false &&
        files.every(aPath => deref.in(state, aPath + "-checksum", false)) &&
        set(checksum, getChecksum(...files.map(aPath => deref.in(state, aPath + "-checksum", false))));

    if (destination && !existsSync(destination))
        mkdirSync(destination);

    const completed = destination;// && (existsSync(destination) && mkdirSync(destination), destination);//mkdir.await(refine(state, "mkdir"), { destination });

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

