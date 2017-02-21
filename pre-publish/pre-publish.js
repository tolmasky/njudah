
require("./setup");
require("@njudah/builder/promisified")(require("./build"))
    .then(function (x)
    {
        console.log(x);
    });;
