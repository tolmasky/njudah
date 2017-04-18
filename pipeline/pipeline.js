
const { List, Record, fromJS } = require("immutable");
const EmptyList = List();

const { from } = require("generic-jsx");

const identity = x => x;

const Process = Record({ processor: null, request: null , asynchronousRequest: null }, "Process");
const Request = Record({ data: null, priority: 1, process: null }, "Pipeline.Request");
const BatchedRequest = Record({ requests: EmptyList }, "Pipeline.BatchedRequest");
const Response = Record({ request: null, isError: false, value: null }, "Pipeline.Response");

const Pipeline = Record({ backlog: EmptyList, processors: EmptyList, processes: EmptyList, responses: EmptyList });

const asynchronousProgram = require("@njudah/asynchronous/program");
const { fromAsyncFunction } = require("@njudah/asynchronous/request");

function program ({ processors, replacable = false, pull = () => { } })
{
    const initialState = Pipeline({ processors: fromJS(processors) });

    return asynchronousProgram(initialState, function update(aState, anEvent)
    {
        const handler = HANDLERS[anEvent && anEvent._name || ""] || identity;
        
        if (handler === identity && Object.keys(anEvent).length === 0)
            return aState;

        const [processes, backlog] = handler([aState.processes, aState.backlog], anEvent, replacable);

        const dividedProcesses = processes.groupBy(aProcess => !!aProcess.asynchronousRequest.response);
        const remainingProcesses = dividedProcesses.get(false) || EmptyList;
        const completedProcesses = dividedProcesses.get(true) || EmptyList;
    
        const processors = aState.processors;
        const freeProcessors = processors.concat(completedProcesses.map(process => process.processor));

        const necessaryProcessorsCount = Math.min(backlog.size, freeProcessors.size);
        const necessaryProcessors = freeProcessors.take(necessaryProcessorsCount);
        const remainingProcessors = freeProcessors.takeLast(freeProcessors.size - necessaryProcessorsCount);

        const requests = backlog.take(necessaryProcessorsCount);
        const updatedProcesses = necessaryProcessors.zipWith(getProcess, requests).concat(remainingProcesses);
        const remainingBacklog = backlog.takeLast(backlog.size - necessaryProcessorsCount);
        const updatedResponses = completedProcesses.map(getResponse);

        return Pipeline({
            backlog: remainingBacklog,
            processors: remainingProcessors,
            processes: updatedProcesses,
            responses: updatedResponses
        });
    }, pull);
}

module.exports = program;
module.exports.Pipeline = program;

function getProcess(aProcessor, aRequest)
{
    return Process(
    {
        processor: aProcessor,
        request: aRequest,
        asynchronousRequest: fromAsyncFunction(aRequest.process)({ processor: aProcessor, request: aRequest })
    });
}

function getResponse({ request, asynchronousRequest: { response } })
{
    return Response({ request, value: response.value, isError: response.isError });
}

var HANDLERS =
{
    "Pipeline.Request": function ([processes, backlog], aRequest, replacable)
    {
        if (replacable && replacable(aRequest))
            return replace([processes, backlog], aRequest, replacable);

        return [processes, backlog.push(aRequest)];
    },
    "Pipeline.BatchedRequest": function ([processes, backlog], aBatchedPipelineRequest, replacable)
    {
        return [processes, backlog.concat(aBatchedPipelineRequest.requests)];
    }
}

function replace([processes, backlog], aRequest, replacable)
{
    var processesIndex = processes.findIndex(aProcess => replacable(aRequest, aProcess.request));

    if (processesIndex > -1)
        return [processes.setIn([processesIndex, "request"], aRequest), backlog];

    var backlogIndex = backlog.findIndex(anotherRequest => replacable(aRequest, anotherRequest));

    if (backlogIndex > -1)
        return [processes, backlog.set(backlogIndex, aRequest)];

    return [processes, backlog.push(aRequest)];
}

module.exports.Request = Request;
module.exports.BatchedRequest = BatchedRequest;
