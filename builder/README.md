# N Judah Builder

This is a build tool for applying transforms to files.

# How Do I use It?

You specify your build using (generic) JSX:

```JavaScript
const { build, transform } = require("@njudah/builder");
const babel = require("@njudah/builder/transform/babel");

<build  path = "/path/to/your/project"
        destination = "/path/to/build/folder"
        ignore = "**/node_modules" >
    <transform match = "**/*.js" >
        <babel options = { { presets: ["es2015-node4", "stage-0"] } } />
    </transform>
</build>

```

Use the promisified interface to run the build and grab the final location:

```JavaScript

require("@njudah/builder/promisifed")(
    <build  path = "/path/to/your/project"
        destination = "/path/to/build/folder"
        ignore = "**/node_modules" >
        <transform match = "**/*.js" >
            <babel options = { { presets: ["es2015-node4", "stage-0"] } } />
        </transform>
    </build>
)
    .then(function (x)
    {
        console.log(x);
    });

```

If you do not have access to generic JSX, you can use the alternative array syntax:

```JavaScript

require("@njudah/builder/promisifed")(
    [build,
    {
        path: "/path/to/your/project",
        destination: "/path/to/build/folder"
        ignore: "**/node_modules"
    },
        [transform, { match: "**/*.js" },
            [babel, { options: { presets: ["es2015-node4", "stage-0"] } }
        ]
    ]
)
    .then(function (x)
    {
        console.log(x);
    });

```

## build attributes

- **path**: source path
- **destination**: destination folder
- **ignore**: files to ignore. Can be glob string, or array of glob strings.

## transform attributes

- **match** - files to match. Can be glob string, or array of glob strings.

## transform child

Transform expects one child, the actual transform function to run. *babel* is the only currently supported one.

## babel attributes

- **options** - Babel options.

