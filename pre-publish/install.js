
const { dirname, basename, join } = require("path");

const getChecksum = require("../get-checksum");
const { readFileSync, existsSync } = require("fs");
const spawn = require("./spawn");

async function install({ workspace, lockPath })
{try {
    // Here?
    await spawn("mkdir", ["-p", workspace]);

    const checksum = getChecksum(readFileSync(lockPath, "utf-8"));

    const installationPath = join(workspace, checksum);
    const nodeModulesPath = join(installationPath, "node_modules");

    if (existsSync(installationPath))
        return nodeModulesPath;

    const name = basename(lockPath);

    await spawn("mkdir", ["-p", installationPath]);
    await spawn("cp", [lockPath, join(installationPath, name)]);
    await spawn("cp", [join(dirname(lockPath), "package.json"), join(installationPath, "package.json")]);

    const binary = name === "npm-shrinkwrap.json" || name === "package.json" ? "npm" : "yarn";

    await spawn(binary, ["install"], { cwd: installationPath });

    return nodeModulesPath; } catch(E) { console.log(E) }
}

module.exports =install;

//install({ workspace: "/tmp/workspace", lockPath: "/tonic/evaluator/npm-shrinkwrap.json" });