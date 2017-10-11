"use strict";

const path = require("path");
const resolve = aPath => path.resolve(__dirname, aPath);

const options = require("commander")
    .option("--source [source]", "source", resolve(".."))
    .option("--destination [destination]", "destination", resolve("./build-products"))
    .option("--cache [cache]", "cache", resolve("./build-products/cache"))
    .option("--no-register")
    .parse(process.argv);

require("./bootstrap")({ babelRegister: !options.noRegister });

const getBuildSettings = require("./get-build-settings");
const build = require("@njudah/builder/promisified");
const { source, cache, destination } = options;

build(getBuildSettings({ source, cache, destination })).then(console.log);
