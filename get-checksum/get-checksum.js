

module.exports = function getChecksum()
{
    const checksum = require("crypto").createHash("sha256");
    
    for (const item of arguments)
        checksum.update(item);
        
    return checksum.digest("hex");
}