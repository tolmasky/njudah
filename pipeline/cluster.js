
const { fork } = require("child_process");
const { List, Range } = require("immutable");
const { from } = require("generic-jsx");

const { Request, Pipeline } = require("./pipeline");

const event = require("@await/event");
const waitOn = <event
    eventEmitter = { from("process") }
    resolveOn = "message"
    rejectOn = { ["exit", "error", "close", "disconnect"] }
    forceArray = { true } />;

module.exports = function ({ count, source })
{
    const processors = Range(0, count).toList();
    const processes = processors.map(() => unrefFork(source)).toList();
    const push = Pipeline({ processors , pull });
    const timers = { count: 0 };

    async function forward({ processor, request: { data } })
    {
        try
        {
            const child = processes.get(processor);

            const promise = waitOn({ process: child });

            child.send(...data.args);

            return (await promise)[0];
        }
        catch (anException)
        {
            try
            {
                // try to kill the process that threw the exception
                child.kill("SIGHUP");
            }
            catch (err)
            {
                // no need to do anything if we can't kill it
            }

            // spin up a new process in its place
            processes[processor] = unrefFork(source);

            throw anException;
        }
        finally
        {
            clearTimeout(timers[data.timeoutID]);
            delete timers[data.timeoutID];
        }
    }

    return function (...args)
    {
        const timeoutID = timers.count++;
        timers[timeoutID] = setTimeout(function () { }, 2147483647);

        return new Promise((resolve, reject) =>
        {
            push(Request({ data: { args, timeoutID, resolve, reject }, process: forward }));
        });
    }
//}
}

function unrefFork(aSource)
{
    const process = fork(aSource);
    
    process.unref();
    process.channel.unref();
    
    return process;
}

function pull({ responses })
{
    for (const { isError, value, request: { data: { reject, resolve } } } of responses.toArray())    
    {
        (isError ? reject : resolve)(value);
    }
};
