
const transform = require("babel-core").transform;

module.exports = function babel({ contents, options, metadataKeys })
{
    const result = transform(contents, options);

    if (metadataKeys)
    {
        const metadata = { };

        for (const key of metadataKeys)
            metadata[key] = result.metadata[key];

        return { contents:result.code, metadata };
    }

    return transform(contents, options).code;
}
