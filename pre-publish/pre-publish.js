"use strict";


const path = require("path");

const resolve = aPath => path.resolve(__dirname, aPath);
const source = process.argv[2] === "--source" ? process.argv[3] : resolve("..");
const destination = process.argv[4] === "--destination" ? process.argv[5] : resolve("build-products");


require("./bootstrap")({ babelRegister: !(process.argv[6] === "--no-register") });

const getBuildSettings = require("./get-build-settings");
const build = require("@njudah/builder/promisified");


build(getBuildSettings({ source, destination })).then(console.log);
