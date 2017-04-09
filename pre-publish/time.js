
const { basename, dirname, join } = require("path");
const { readdirSync, lstatSync, readFileSync, writeFileSync } = require("fs");

const spawn = require("./spawn");
const { spawn: spawn_ } = require("child_process");
const uuid = require("uuid");

const WORKSPACE = "/tmp/njudah/";
const WORKSPACE_DEPENDENCIES = "/tmp/njudah/dependencies";
const WORKSPACE_EXECUTIONS = "/tmp/njudah/executions";

const install = require("./install");

const SOURCE = dirname(__dirname);

(async function ()
{
    const executionPath = join(WORKSPACE_EXECUTIONS, uuid.v4());
    const firstPassPath = join(executionPath, "firstPass");

    // Step 1: Build normally using babel-register.
    const firstPassBuildPath = await timed("FIRST PASS", prePublish)(
    {
        path: "pre-publish.js",
        destination: join(firstPassPath, "build-products"),
        babelRegister: true
    })

    const nodeModulesPath = join(firstPassPath, "/node_modules");

    await spawn("mkdir", ["-p", nodeModulesPath]);
    
    const njudahPath = join(nodeModulesPath, "@njudah");

    await spawn("ln", ["-s", firstPassBuildPath, njudahPath]);

    await Promise.all(readdirSync(njudahPath).map(async function (aPackageName)
    {
        const packagePath = join(njudahPath, aPackageName);
    
        if (aPackageName === "fast-fs") {console.log(aPackageName);
            return await spawn ("yarn", ["install"], { cwd: packagePath });
}
        if (lstatSync(packagePath).isFile())
            return;
        
        const packageJSONPath = join(packagePath, "package.json");
        const packageJSON = JSON.parse(readFileSync(packageJSONPath, "utf-8"));
        const dependencies = packageJSON.dependencies || { };
        const noNJudahDependencies = Object.keys(dependencies)
            .filter(aDependency => aDependency.indexOf("@njudah/") !== 0)
            .reduce((previous, aDependency) => Object.assign(previous, { [aDependency]:dependencies[aDependency] }), { });
        const noNJudahPackageJSON = Object.assign({ }, packageJSON, { dependencies: noNJudahDependencies });

        writeFileSync(packageJSONPath, JSON.stringify(noNJudahPackageJSON, null, 2), "utf-8");

        const installationPath = await install(
        {
            workspace: WORKSPACE_DEPENDENCIES,
            lockPath: packageJSONPath
        });
        
        await spawn("rm", ["-rf", join(installationPath, "@njudah")]);

        await spawn("ln", ["-s", installationPath, join(packagePath, "node_modules")]);       
        
    }));

    const secondPassBuildPath = await timed("SECOND PASS", prePublish)(
    {
        path: join(firstPassBuildPath, "pre-publish", "pre-publish.js"),
        destination: join(executionPath, "secondPass"),
        babelRegister: false
    });  

    const thirdPassBuildPath = await timed("THIRD PASS", prePublish)(
    {
        path: join(firstPassBuildPath, "pre-publish", "pre-publish.js"),
        destination: join(executionPath, "secondPass"),
        babelRegister: false
    });
})();

function prePublish({ path, destination, babelRegister })
{
    const args = ["node", path, "--source", SOURCE, "--destination", destination, babelRegister ? "" : "--no-register"];
    var string = "";
console.log("time " + args.join(" "));
    return new Promise(function (resolve, reject)
    {
        const process = spawn_("time", args)
            .on("close", () => resolve(string.match(/([^\n]*)\n$/)[1]));
        
        process.stdout.on("data", function (data)
            {
                string += data + ""
                console.log(data + "");
            })
        process.stderr.on("data", function (data)
            {
                console.log(data + "");
            });
    });
}

function timed(aMessage, aFunction)
{
    return async function ()
    {
        const start = new Date();
        const result = await aFunction.apply(this, arguments);

        console.log(aMessage + " IN " + (new Date() - start));

        return result;
    }
}
