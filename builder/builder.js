
const { mkdirp, tstat, readdir, copy, read } = require("./fs-sync");
const { find: findTransform, transform } = require("./transform");
const toMatcher = require("./to-matcher");
const { refine, deref, set, exists, stem } = require("@njudah/cursor");
const { relative, join, basename, extname, resolve } = require("path");
const { stringify } = JSON;
const getChecksum = require("@njudah/get-checksum");
const { fromJS, Map } = require("immutable");
const uuid = require("uuid");


module.exports.build = function build({ source, destination, cache, state, children = [], ignore })
{
    const ignoreMatcher = toMatcher.mcall(refine(state, "ignore"), ignore, destination, "**/.*");
    const metadata = refine(state, "metadata");
    const unique = uuid.mcall(refine(state, "uuid"));
    const root = resolve(source);

    return  <stem>
                <mkdirp path = { destination } />
                <mkdirp path = { cache } />
                <item   root = { root }
                        source = { root }
                        state = { refine(state, "item") }
                        transforms = { transform.optimize.await(refine(state, "optimize"), children) }
                        ignore = { ignoreMatcher }
                        cache = { cache }
                        metadata = { metadata }
                        destination = { join(destination, unique) } />
            </stem>
}

module.exports.transform = require("./transform");

function item({ source, state, ignore, ...rest })
{
    if (ignore.mcall(refine(state, "ignored"), source))
        return "ignored";

    const which = tstat.mcall(refine(state, "type"), { path: source });
    const type = which === "file" ? file : directory;

    return <type    source = { source }
                    ignore = { ignore }
                    { ...rest }
                    state = { refine(state, "implementation") } />;
}

function file({ source, cache, transforms, state, metadata, destination, root })
{
    const { transform, checksum: transformChecksum } = findTransform.mcall(
        refine(state, "find-checksum"), source, transforms) || { };

    if (!transform)
        return <copy source = { source } destination = { destination } />;

    const contents = read({ path: source, encoding: "utf-8" });
    const fileChecksum = getChecksum(contents);
    const extension = extname(source);
    const checksum = getChecksum(stringify({ transformChecksum, fileChecksum, extension }));

    const artifactsPath = join(cache, checksum);
    const rooted = join("~", relative(root, source));
    const transformed =
        transform({ source: rooted, root, contents, destination: artifactsPath });

    if (!exists(metadata) && transformed.metadata)
        set(metadata, fromJS(transformed.metadata));

    return  <copy   source = { transformed.transformedPath }
                    destination = { destination } />;
}

function directory({ source, cache, transforms, state, ignore, metadata, destination, root })
{
    const children = readdir.mcall(refine(state, "children"), { path: source });

    if (children.length <= 0 || !transforms)
        return <stem/>;

    if (!exists(metadata))
        set(metadata, Map());

    return  <stem path = { source } >
                <mkdirp path = { destination } />
                {   children.map(name =>
                    <item   root = { root }
                            source = { join(source, name) }
                            ignore = { ignore }
                            transforms = { transforms }
                            state = { refine(state, name) }
                            cache = { cache }
                            destination = { join(destination, basename(name)) }
                            metadata = { refine(metadata, name) } />)
                }
            </stem>;
}


