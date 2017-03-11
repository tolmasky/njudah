
const { spawn: spawn_ } = require("child_process");

module.exports = function spawn(command, args = [], options)
{
    return new Promise(function(resolve, reject)
    {
        spawn_(command, args, Object.assign({ stdio: "inherit" }, options))
            .on("close", function (exitCode)
            {
                if (exitCode !== 0)
                    return reject(new Error("Error " + exitCode));
                
                resolve(exitCode);
            });
    });
};