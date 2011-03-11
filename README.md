Mirror
------
Mirror node.js module files to the browser. Simplifies application development
when writing js code that is used both client-side and server-side.

### Tested with

- joyent node v0.2.6
- creationix step v0.0.4
- visionmedia express 1.0.7

### Usage

Mirror works by resolving module paths using the node `module` object cache.
Module files to be mirrored should be represented by a string path:

    [module]/[filepath]

- `module` is the module name as would be used when calling `require()`.
- `filepath` is the path to the desired file relative to the module root
  directory.

Files can be mirrored directly or packaged together in the case javascript,
css or other text files.

    // Express middleware that serves file described by <asset>
    mirror.file( <asset> );

    // Express middleware that serves assets joined (\n). [headers] is an
    // optional headers object, defaults to that suitable for javascript.
    mirror.asset( [ <asset1>, <asset2>, ... <assetn> ], [headers] );

### Example

Create an Express server, add a `vendor.js` package of assets and serve some
module css/image files:

    var server = require('express').createServer();
    var mirror = require('mirror');

    server.get('/vendor.js', mirror.assets([
        'underscore/underscore.js',
        'backbone/backbone.js',
        'bones/bones.js',
        'bones-admin/bones-admin.js'
    ]));
    server.get('/bones-admin.css', mirror.file('bones-admin/bones-admin.css'));
    server.get('/bones-admin.png', mirror.file('bones-admin/bones-admin.png'));

    server.listen(8889);

### Authors

- [Young Hahn](http://github.com/yhahn)

