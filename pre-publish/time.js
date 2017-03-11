
const { basename, dirname, join } = require("path");
const { readdirSync, lstatSync } = require("fs");

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
    
        if (lstatSync(packagePath).isFile())
            return;

        const installationPath = await install(
        {
            workspace: WORKSPACE_DEPENDENCIES,
            lockPath: join(packagePath, "package.json")
        });

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
    const args = ["node", path, "--source", SOURCE, "--destination", destination, babelRegister ? "" : "--no-register", "--prof"];
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
