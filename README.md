# Mirror

Aggregates JavaScript, CSS and any other text files for serving them to browsers with [express](http://expressjs.com/). Supports wrapping and postprocessing outputs. A *mirror* can contain files, plain source code or other mirrors.

### Usage

```javascript
var mirror = require('mirror');

// Mirror guesses the MIME type based on the first file's extension.
var styles = new mirror([
    __dirname + '/assets/main.css',
    __dirname + '/assets/layout.css'
]);

// Proving direct source input requires specifying the MIME type manually.
var configuration = new mirror([
    // Mirror automatically inserts line breaks and semicolons before/after
    // each item in a "js" type mirror.
    mirror('var basepath = "/"'),
    mirror('var config = ' + JSON.stringify(config)),

    // You can add functions to the mirror. They will be called on each request.
    mirror(function(callback, req, res) {
        callback(null, 'var url = ' + JSON.stringify(req.url));
    })
], {
    type: 'js',
    maxAge: 60  // Only cache configuration file for 60 seconds.
});

// Store the array of files and remove or add files on-the-fly.
var files = [
    require.resolve('underscore'),
    require.resolve('backbone'),
    require.resolve('mymodule/client.js'),

    // Add other mirrors
    configuration
];

// Add the mirrors to your express server.
app.get('/assets/style.css', styles);
app.get('/assets/configuration.json', configuration);
app.get('/assets/scripts.js', new mirror(files, { minify: true }));
```

**NOTE:** Mirror loads the requested files from disk for every request. It is meant to run behind a reverse proxy that caches. You can control the cache time with `maxAge` (in seconds) in the options hash.

### Authors

- [Young Hahn](https://github.com/yhahn)
- [Konstantin Käfer](https://github.com/kkaefer)

