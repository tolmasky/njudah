
const program = require("./program");


module.exports = function (aTree, aKeyPath)
{
    return new Promise(function (resolve, reject)
    {
        return program(aTree, function (aState, isComplete)
        {
            if (isComplete)
            {
                if (typeof aKeyPath === "string")
                    return resolve(aState.getIn(aKeyPath));
            
                if (typeof aKeyPath === "function")
                    return resolve(aKeyPath(aState));
            
                return aState;
            }
        })({ a: 0 });
    });
}
