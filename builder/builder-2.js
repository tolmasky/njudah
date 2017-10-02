
const { mkdirp, tstat, readdir, copy, read } = require("./fs-sync");
const { find: findTransform, transform } = require("./transform");
const toMatcher = require("./to-matcher");
const { refine, deref, set, exists, stem } = require("@njudah/cursor");
const { join, basename, extname } = require("path");
const { stringify } = JSON;
const getChecksum = require("@njudah/get-checksum");


module.exports.build = function build({ source, destination, cache, state, children = [], ignore })
{
    const ignoreMatcher = toMatcher.mcall(refine(state, "ignore"), ignore, destination, "**/.*");
    const metadata = refine(state, "metadata");

    return  <stem>
                <mkdirp path = { destination } />
                <mkdirp path = { cache } />
                <item   source = { source }
                        state = { refine(state, "item") }
                        transforms = { transform.optimize.await(refine(state, "optimize"), children) }
                        ignore = { ignoreMatcher }
                        cache = { cache }
                        metadata = { metadata }
                        destination = { destination } />
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

function file({ source, cache, transforms, state, metadata, destination })
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
    const { transformedPath, metadataPath } =
        transform({ source, contents, destination: artifactsPath });

    return  <copy   source = { transformedPath }
                    destination = { destination } />;
}

function directory({ source, cache, transforms, state, ignore, destination })
{
    const children = readdir.mcall(refine(state, "children"), { path: source });

    if (children.length <= 0 || !transforms)
        return <stem/>;

    return  <stem path = { source } >
                <mkdirp path = { destination } />
                {   children.map(name =>
                    <item   source = { join(source, name) }
                            ignore = { ignore }
                            transforms = { transforms }
                            state = { refine(state, name) }
                            cache = { cache }
                            destination = { join(destination, basename(name)) } />)
                }
            </stem>;
}


