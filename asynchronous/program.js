
const Call = (Function.prototype.call).bind(Function.prototype.call);
const Apply = (Function.prototype.call).bind(Function.prototype.apply);

const ArrayReduce = Array.prototype.reduce;

const I = require("immutable");
const isIterable = I.Iterable.isIterable;
const EmptyMap = I.Map();

const program = require("@njudah/program");
const AsynchronousRequest = require("./request");
const AsynchronousResponse = AsynchronousRequest.AsynchronousResponse;

const AsynchronousResponseEvent = I.Record({ responses: [] }, "AsynchronousResponseEvent");

module.exports = function (aState, update, pull)
{
    const asynchronousCache = Object.create(null);
    const push = program(aState, function (aState, anEvent)
    {
        const state = anEvent instanceof AsynchronousResponseEvent ?
            handleAsynchronousResponseEvent(aState, anEvent, asynchronousCache) :
            aState;

        return (function exhaust(aState, anEvent)
        {
            const updatedState = update(aState, anEvent);
            const responseState = registerAsynchronousRequests(updatedState, pushAsynchronousResponse, asynchronousCache);

            if (aState === responseState)//I.is(aState, responseState))
                return aState;

            return exhaust(responseState, { });
        })(state, anEvent);
    }, function (aState)
    {
        pull(aState, getPendingAsynchronousFunctions(aState).size <= 0);
    });
    const pushAsynchronousResponse = getPushAsynchronousResponse(push);

    return push;
}

function registerAsynchronousRequests(aState, pushAsynchronousResponse, asynchronousCache)
{
    const pendingAsynchronousFunctions = getPendingAsynchronousFunctions(aState);

    return pendingAsynchronousFunctions.reduce(function (aState, anAsynchronousFunction, aUUID)
    {
        if (!asynchronousCache[aUUID])//Call(hasOwnProperty, asynchronousCache, aUUID))
        {
            asynchronousCache[aUUID] = 
            {
                cancel: anAsynchronousFunction.function(
                    aResult => pushAsynchronousResponse(aUUID, AsynchronousResponse({ value: I.fromJS(aResult) })),
                    aResult => pushAsynchronousResponse(aUUID, AsynchronousResponse({ isError: true, value: aResult })))
            };

            return aState;
        }

        if (!asynchronousCache[aUUID].response)//Call(hasOwnProperty, asynchronousCache[aUUID], "response"))
            return aState;

        const response = asynchronousCache[aUUID].response;

        return serviceAsynchronousRequests(getPendingAsynchronousFunctions, aState, aUUID, response);
    }, aState);
}

function getPushAsynchronousResponse(push, shouldCoallesce)
{
    let responses = null;

    return function (aUUID, aResponse)
    {        
        if (responses)
            return responses[aUUID] = aResponse;

        responses = { [aUUID]: aResponse };
        
        setTimeout(function ()
        {
            const event = AsynchronousResponseEvent({ responses });
            responses = null;
            push(event);
        }, 5);
    }
}

function handleAsynchronousResponseEvent(anObject, anEvent, asynchronousCache)
{
    const responses = anEvent.responses;
    const keys = Object.keys(responses);

    return Call(ArrayReduce, keys, function (anObject, aKey)
    {
        const response = responses[aKey];
        const hasExistingResponse = !!asynchronousCache[aKey].response;

        asynchronousCache[aKey].response = response;

        return serviceAsynchronousRequests(
            hasExistingResponse ? getAsynchronousFunctions : getPendingAsynchronousFunctions,
            anObject, aKey, responses[aKey]);
    }, anObject);
}

function serviceAsynchronousRequests(getAsynchronousFunctions, anObject, aUUID, aResponse)
{
    if (!getAsynchronousFunctions(anObject).has(aUUID))
        return anObject;

    if (anObject instanceof AsynchronousRequest)
        return  anObject.function.UUID === aUUID ? anObject.set("response", aResponse) : anObject;

    return anObject.reduce(function (anObject, aValue, aKey)
    {
        const newValue = serviceAsynchronousRequests(getAsynchronousFunctions, aValue, aUUID, aResponse);

        if (newValue !== aValue)
            return anObject.set(aKey, newValue);

        return anObject;
    }, anObject);
}

function getAsynchronousFunctions(anObject)
{
    return getCachedAsynchronousFunctions("__asynchronousFunctions", null, anObject);
}

function getPendingAsynchronousFunctions(anObject)
{
    return getCachedAsynchronousFunctions("__prendingAsynchronous", function (anAsynchronousRequest)
    {
        return anAsynchronousRequest.response === null;
    }, anObject);
}

function getCachedAsynchronousFunctions(aCacheKey, aPredicate, anObject)
{
    if (!anObject || anObject.__asynchronousIgnore)
        return EmptyMap;

    if (anObject[aCacheKey])
        return anObject[aCacheKey];

    if (!isIterable(anObject))
        return EmptyMap;

    return anObject[aCacheKey] = (function ()
    {
        if (anObject instanceof AsynchronousRequest)
            return !aPredicate || aPredicate(anObject) ? I.Map({ [anObject.function.UUID]: anObject.function }) : EmptyMap;

        return anObject.reduce(function (aMap, aValue)
        {
            const functions = getCachedAsynchronousFunctions(aCacheKey, aPredicate, aValue);
    
            if (functions === EmptyMap)
                return aMap;
            
            if (aMap === EmptyMap)
                return functions;
            
            return aMap.merge(functions);
        },
            EmptyMap);
    })();
}
