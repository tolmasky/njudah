

const totals = { };

process.on("exit", function ()
{
    console.error(Object.keys(totals).sort(function(lhs, rhs)
    {
        const lhsAvg = totals[lhs].time / totals[lhs].count;
        const rhsAvg = totals[rhs].time / totals[rhs].count;
        
        if (lhsAvg < rhsAvg)
            return 1;
        
        if (lhsAvg === rhsAvg)
            return 0;
            
        return -1;
    }).map(function (aName)
    {
        return aName + " : " + totals[aName].time + " / " + totals[aName].count + " = \t\t" + (totals[aName].time / totals[aName].count);
    }).join("\n"));
});

module.exports = function time(aFunction, n)
{
    var inside = 0;
    var name = n || aFunction.name;
    
    if (!totals[name])
        totals[name] = { count:0, time:0 };

    return function()
    {
        ++inside
        var date = new Date();
        let r = aFunction.apply(this, arguments);
        totals[name].count++;
        if (--inside === 0)
            totals[name].time += (new Date() - date);
        return r;
    }
}
