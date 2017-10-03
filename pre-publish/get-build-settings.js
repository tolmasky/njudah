
const { join } = require("path");
const { build, transform } = require("@njudah/builder");
const babel = require("@njudah/builder/transform/babel");



module.exports = function ({ source, cache, destination })
{
    return  <build  source = { source }
                    destination = { destination }
                    cache = { cache }
                    ignore = { [join(source, "pre-publish", "build-products"), join(source, "**/node_modules"), join(source, "*/build")] } >
                <transform match = "**/*.js" >
                    <babel options = { require("./babel-settings") } />
                </transform>
            </build>;
}