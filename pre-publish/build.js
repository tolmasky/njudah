
const path = require("path");
const { build, transform } = require("@njudah/builder");
const babel = require("@njudah/builder/transform/babel");

module.exports =

<build  path = { path.resolve("..") }
        destination = { path.resolve("build") }
        ignore = { [path.resolve("../pre-publish"), path.resolve("../*/node_modules")] } >
    <transform match = "**/*.js" >
        <babel options = { require("./babel-settings") } />
    </transform>
</build>;
