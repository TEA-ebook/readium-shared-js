# readium-shared-js

**EPUB rendering engine written in HTML, CSS and Javascript.**

This is a software component commonly-shared between the Readium Chrome extension and "cloud reader" ( https://github.com/readium/readium-js-viewer ),
as well as various native application "launchers" such as iOS ( https://github.com/readium/SDKLauncher-iOS ),
OSX ( https://github.com/readium/SDKLauncher-OSX ),
Android ( https://github.com/readium/SDKLauncher-Android ),
Windows ( https://github.com/readium/SDKLauncher-Windows ), etc.

You can try Readium here:

* Online "cloud reader" demo: http://readium-cloudreader.divshot.io
* Chrome extension (can be used offline): https://chrome.google.com/webstore/detail/readium/fepbnnnkkadjhjahcafoaglimekefifl


## License

**BSD-3-Clause** ( http://opensource.org/licenses/BSD-3-Clause )

See license.txt ( https://github.com/readium/readium-shared-js/blob/develop/license.txt )


## Prerequisites

* A decent terminal. On Windows, GitShell works great ( http://git-scm.com ), GitBash works too ( https://msysgit.github.io ), and Cygwin adds useful commands ( https://www.cygwin.com ).
* NodeJS ( https://nodejs.org )


## Development

**Initial setup:**


* `git submodule update --init --recursive` to ensure that the readium-shared-js chain of dependencies is initialised (readium-cfi-js)
* `npm run prepare` (to perform required preliminary tasks, like patching code before building)

Note that the above command executes the following:

* `npm install` (to download dependencies defined in `package.json` ... note that the `--production` option can be used to avoid downloading development dependencies, for example when testing only the pre-built `build-output` folder contents)
* `npm update` (to make sure that the dependency tree is up to date)

**Typical workflow:**

* Hack away! (mostly the source code in the `js` and `plugins` folders)
* `npm run build` (to update the RequireJS bundles in the build output folder)
* `npm run http:watch` (to launch an http server with live-reload, automatically opens a web browser instance to the HTML files in the `dev` folder)
* `npm run http` (same as above, but without watching for file changes (no automatic rebuild))

## NPM (Node Package Manager)

All packages "owned" and maintained by the Readium Foundation are listed here: https://www.npmjs.com/~readium

Note that although Node and NPM natively use the CommonJS format, Readium modules are currently only defined as AMD (RequireJS).
This explains why Browserify ( http://browserify.org ) is not used by this Readium project.
More information at http://requirejs.org/docs/commonjs.html and http://requirejs.org/docs/node.html

* Make sure `npm install readium-shared-js` completes successfully ( https://www.npmjs.com/package/readium-shared-js )
* Execute `npm run http`, which opens a web browser to a basic RequireJS bootstrapper located in the `dev` folder (this is *not* a fully-functioning application!)
* To see an actual application that uses this "readium-shared-js" component, try "readium-js-viewer" ( https://www.npmjs.com/package/readium-js-viewer )

Note: the `--dev` option after `npm install readium-shared-js` can be used to force the download of development dependencies,
but this is kind of pointless as the code source and RequireJS build configuration files are missing.
See below if you need to hack the code.


## How to use (RequireJS bundles / AMD modules)

The `build-output` directory contains common CSS styles, as well as two distinct folders:

### Single bundle

The `_single-bundle` folder contains `readium-shared-js_all.js` (and its associated source-map file, as well as a RequireJS bundle index file (which isn't actually needed at runtime, so here just as a reference)),
which aggregates all the required code (external library dependencies included, such as Underscore, jQuery, etc.),
as well as the "Almond" lightweight AMD loader ( https://github.com/jrburke/almond ).

This means that the full RequireJS library ( http://requirejs.org ) is not actually needed to bootstrap the AMD modules at runtime,
as demonstrated by the HTML file in the `dev` folder (trimmed for brevity):

```html
<html>
<head>

<!-- main code bundle, which includes its own Almond AMD loader (no need for the full RequireJS library) -->
<script type="text/javascript" src="../build-output/_single-bundle/readium-shared-js_all.js"> </script>

<!-- index.js calls into the above library -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```

### Multiple bundles


The `_multiple-bundles` folder contains several Javascript bundles (and their respective source-map files, as well as RequireJS bundle index files):


* `readium-external-libs.js`: aggregated library dependencies (e.g. Underscore, jQuery, etc.)
* `readium-cfi-js.js`: Readium CFI library (basically, equivalent to the `js` folder of the readium-cfi-js submodule)
* `readium-shared-js.js`: Readium-specific code (basically, equivalent to the `js` folder)
* `readium-plugin-example.js`: simple plugin demo
* `readium-plugin-annotations.js`: the annotation plugin (DOM selection + highlight), which bundle actually contains the "Backbone" library, as this dependency is not already included in the "external libs" bundle.

In addition, the folder contains the full `RequireJS.js` library ( http://requirejs.org ), as the above bundles do no include the lightweight "Almond" AMD loader ( https://github.com/jrburke/almond ).

Usage is demonstrated by the HTML file in the `dev` folder (trimmed for brevity):

```html
<html>
<head>

<!-- full RequireJS library -->
<script type="text/javascript" src="../build-output/_multiple-bundles/RequireJS.js"> </script>



<!-- individual bundles: -->

<!-- readium CFI library -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-cfi-js.js"> </script>

<!-- external libraries -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js"> </script>

<!-- readium itself -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js"> </script>

<!-- simple example plugin -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js"> </script>

<!-- annotations plugin -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js"> </script>



<!-- index.js calls into the above libraries -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```


Note how the various sets of AMD modules can be invoked on-demand (lazy) using the `bundles` RequireJS configuration directive
(this eliminates the apparent opacity of such as large container of library dependencies):


```html

<script type="text/javascript">
requirejs.config({
    baseUrl: '../build-output/_multiple-bundles'
});
</script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-cfi-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js.bundles.js"> </script>

```




## CSON vs. JSON (package.json)

CSON = CoffeeScript-Object-Notation ( https://github.com/bevry/cson )

Running the command `npm run cson2json` will re-generate the `package.json` JSON file.
For more information, see comments in the master `package.cson` CSON file.

Why CSON? Because it is a lot more readable than JSON, and therefore easier to maintain.
The syntax is not only less verbose (separators, etc.), more importantly it allows *comments* and *line breaking*!

Although these benefits are not so critical for basic "package" definitions,
here `package.cson/json` declares relatively intricate `script` tasks that are used in the development workflow.
`npm run SCRIPT_NAME` offers a lightweight technique to handle most build tasks,
as NPM CLI utilities are available to perform cross-platform operations (agnostic to the actual command line interface / shell).
For more complex build processes, Grunt / Gulp can be used, but these build systems do not necessarily offer the most readable / maintainable options.

Downside: DO NOT invoke `npm init` or `npm install --save` `--save-dev` `--save-optional`,
as this would overwrite / update the JSON, not the master CSON!
