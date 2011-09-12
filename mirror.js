var env = process.env.NODE_ENV || 'development';

var fs = require('fs');
var path = require('path');
var uglify = require('uglify-js');

module.exports = exports = Mirror;
function Mirror(assets, options) {
    if (!Array.isArray(assets)) {
        if (this instanceof Mirror) {
            throw new Error('First parameter must be an array.');
        } else return {
            content: assets,
            filename: options || null
        };
    }

    // Make `instanceof Mirror` work and allow recursive embedding.
    assets.__proto__ = this;

    if (!options) options = {};

    // Content-Type
    if (!options.type) {
        if (assets.length && !assets[0].join) {
            options.type = path.extname(assets[0]).toLowerCase();
        } else {
            options.type = '.txt';
        }
    } else if (options.type[0] !== '.') {
        options.type = '.' + options.type.toLowerCase();
    }

    // Cache-Control
    if (!('maxAge' in options)) options.maxAge = Mirror.defaults.maxAge; // 2 weeks

    // Separator
    if (!('separator' in options)) options.separator = Mirror.defaults.separator;

    // Minify
    if (!('minify' in options)) options.minify = Mirror.defaults.minify;

    // Setup header fields
    if (!options.headers) options.headers = {};
    if (!('Content-Type' in options.headers)) {
        options.headers['Content-Type'] = Mirror.headers[options.type] || 'text/plain';
    }
    if (!('Cache-Control' in options.headers)) {
        options.headers['Cache-Control'] = 'max-age=' + options.maxAge;
    }

    this.assets = assets;
    this.options = options;
    this.handler = this.handler.bind(this);
    this.content = this.content.bind(this);

    return assets;
};

// Make `instanceof Array` work on return values.
Mirror.prototype.__proto__ = Array.prototype;

Mirror.defaults = {
    maxAge: env === 'production' ? 1209600 : 0,
    separator: '\n',
    minify: env === 'production'
};

Mirror.headers = {
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css'
};

Mirror.wrappers = {
    '.js': function(content, filename, options) {
        return '\n;' + content + '\n;';
    }
};

Mirror.processors = {
    '.js': function(content, options) {
        if (options.minify) {
            var ast = uglify.parser.parse(content);
            ast = uglify.uglify.ast_mangle(ast);
            ast = uglify.uglify.ast_squeeze(ast);
            return uglify.uglify.gen_code(ast);
        } else {
            return content;
        }
    }
};

// Allow adding the files "array" as a express callback directly. This is a
// shortcut that only works with express because it calls files.call().
// In new code, use files.handler instead.
Mirror.prototype.call = function(_, req, res, next) {
    return this.handler(req, res, next);
};

Mirror.prototype.handler = function(req, res, next) {
    this.content(function(err, data) {
        if (err) return next(err);

        if (Mirror.processors[this.options.type]) {
            data = Mirror.processors[this.options.type](data, this.options);
        }

        res.send(data, this.options.headers);
    }.bind(this), req, res);
};

function filename(obj) {
    return typeof obj === 'string' ? obj : obj.filename || null;
}

Mirror.prototype.content = function(callback, req, res) {
    if (this.options.sort) this.options.sort(this.assets);
    if (!this.assets.length) return callback(null, '');

    var result = [];
    var pending = this.assets.length;
    var cancelled = false;

    var done = function() {
        cancelled = true;
        if (this.options.wrapper) for (var i = 0; i < result.length; i++) {
            result[i] = this.options.wrapper(result[i],
                    filename(this.assets[i]), this.options);
        }
        if (Mirror.wrappers[this.options.type]) for (var i = 0; i < result.length; i++) {
            result[i] = Mirror.wrappers[this.options.type](result[i],
                    filename(this.assets[i]), this.options);
        }
        callback(null, result.join(this.options.separator));
    }.bind(this);

    this.assets.forEach(function(asset, i) {
        if (typeof asset.content === 'function') {
            asset.content(loaded, req, res);
        } else if (typeof asset.content !== 'undefined') {
            loaded(null, '' + asset.content);
        } else {
            fs.readFile(asset, 'utf8', loaded);
        }

        function loaded(err, data) {
            if (cancelled) { return; }
            if (err) { cancelled = true; return callback(err); }
            result[i] = data;
            if (!--pending) done();
        }
    });
};

// Compatibility to 0.2
Mirror.assets = function(assets, options) {
    if (!Array.isArray(assets)) assets = [ assets ];
    return new Mirror(assets, options);
};

Mirror.source = function(sources, options) {
    if (!Array.isArray(sources)) sources = [ sources ];
    return new Mirror(sources, options);
};
