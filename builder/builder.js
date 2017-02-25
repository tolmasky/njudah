
const path = require("path");

const I = require("immutable");

const getChecksum = require("@njudah/get-checksum");
const getFileChecksum = require("./get-file-checksum");
const getFileDescription = require("./get-file-description");

const { transform, find: findTransform } = require("./transform");
const { refine, deref, set, exists } = require("@njudah/cursor");

const copy = require("./fs/copy");
const mkdir = require("./fs/mkdir");
const writeFile = require("./fs/write-file");

const id = x => x;
const toMatcher = require("./to-matcher");

module.exports = Build;
module.exports.build = Build;
module.exports.transform = transform;

function Build({ path: source, destination, state, children, ignore })
{
    const checksum = refine(state, "checksum");
    const checksumValue = deref(checksum, false);

    const cachePath = path.join(destination, "cache");
    const productPath = checksumValue && mkdir.p.await(refine(state, "product"), path.join(destination, checksumValue));
    const mergedIgnore = toMatcher.memoizedCall(refine(state, "ignore"), ignore, destination, "**/.*");
    const metadata = refine(state, "metadata");

    return  <id>
                <Item   source = { source }
                        state = { refine(state, "item") }
                        transforms = { children }
                        checksum = { checksum }
                        ignore = { mergedIgnore }
                        cache = { mkdir.p.await(refine(state, "cache"), cachePath) }
                        metadata = { metadata }
                        destination = { productPath && path.join(productPath, path.basename(source)) } />
                {   deref(metadata, false) && checksumValue &&
                    <writeFile.result
                        state = { refine(state, "write") }
                        destination = { path.join(productPath, path.basename(source) + ".metadata.json") }
                        contents = { JSON.stringify(deref(metadata), null, 2) } />
                }
            </id>
}


function Item({ source, state, ignore, checksum, ...rest })
{
    if (ignore(source))
        return set(checksum, "ignored");

    const fileDescription = getFileDescription.await(refine(state, "file-description"), source);

    if (!fileDescription)
        return;

    const attributes = { source, ignore, checksum, ...rest };
    const Type = fileDescription.type === "file" ? File : Directory;

    return <Type
                { ...attributes }
                files = { fileDescription.children }
                state = { refine(state, "type") } />;
}

/*
    if (!fileDescription)
        return  <FileDescription state = { refine(state, "file-description") } source = { source } >
                    <Item source = { source } { ...rest } fileDescription = { from("result") } />
                </FileDescription>;
*/

function File({ source, cache, checksum, transforms, state, destination, metadata })
{
    if (!exists(state))
        set(state, I.Map());

    const fileChecksum = getFileChecksum.await(refine(state, "file-checksum"), source);

    if (!fileChecksum)
        return;

    const { transform, checksum: transformChecksum } = findTransform(source, transforms) || { };
    const checksumValue = set(checksum, getChecksum(JSON.stringify({ transformChecksum, fileChecksum })));

    const transformed = transform && transform.await(refine(state, "transformed"),
        { source, cache, checksum: checksumValue });
    const artifactPath = transform ? transformed && transformed.get("contentsPath") : source;

    if (transformed)
        set(metadata, I.Map({ [source]: transformed.get("metadata") }));

    return  transformed && destination &&
            <copy.result
                    metadata = { transformed.get("metadata") }
                    state = { refine(state, "copy") }
                    source = { artifactPath }
                    destination = { destination } />
                    
}

const EmptySet = I.Set();
const EmptyMap = I.Map();

const merge = EmptyMap.merge.bind(EmptyMap);

function Directory({ source, destination, cache, files, checksum, transforms, ignore, state, metadata })
{
    const hasChecksum = files.every(aPath => deref.in(state, aPath + "-checksum", false));
    const checksumValue = set(checksum, hasChecksum &&
        getChecksum(...files.map(aPath => deref.in(state, aPath + "-checksum", false))));
    const completed = destination && mkdir.await(refine(state, "mkdir"), { destination });

    if (files.every(aPath => deref.in(state, aPath + "-metadata", false)))
        set(metadata, merge.memoizedCall(refine(state, "union"),
            ...files.map(file => deref.in(state, file + "-metadata", EmptyMap))));

    return  <id path = { source } checksum = { checksumValue } >
            {
                files.map(aPath =>
                        <Item
                            source = { aPath }
                            ignore = { ignore }
                            checksum = { refine(state, aPath + "-checksum") }
                            transforms = { transforms } 
                            state = { refine(state, aPath) }
                            cache = { cache }
                            metadata = { refine(state, aPath + "-metadata") }
                            destination = { completed && path.join(destination, path.basename(aPath)) } />)
            }
            </id>
}
