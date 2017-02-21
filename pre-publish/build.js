
const path = require("path");
const { build, transform } = require("@njudah/builder");
const babel = require("@njudah/builder/transform/babel");
const resolve = aPath => path.resolve(__dirname, aPath);

module.exports =

<build  path = { resolve("..") }
        destination = { resolve("build") }
        ignore = { [resolve("../pre-publish"), resolve("../*/node_modules")] } >
    <transform match = "**/*.js" >
        <babel options = { require("./babel-settings") } />
    </transform>
</build>;
