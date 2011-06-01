var fs = require('fs');
var path = require('path');
var uglify = require('uglify-js');

module.exports = exports = Mirror;
function Mirror(assets, options) {
    if (!Array.isArray(assets)) throw new Error('First parameter must be an array.');
    if (!options) options = {};

    // Content-Type
    if (!options.type) {
        if (assets.length) options.type = path.extname(assets[0]).toLowerCase();
        else options.type = '.js';
    } else if (options.type[0] !== '.') {
        options.type = '.' + options.type.toLowerCase();
    }

    // Cache-Control
    if (!('maxAge' in options)) options.maxAge = 3600; // 1 hour

    // Separator
    if (!('separator' in options)) options.separator = '\n';

    // Minify
    if (!('minify' in options)) options.minify = false;

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
    this.load = this.load.bind(this);
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

Mirror.prototype.push = function() {
    return this.assets.push.apply(this.assets, arguments);
};

Mirror.prototype.handler = function(req, res, next) {
    this.load(function(err, data) {
        if (err) next(err);
        else if (this.options.minify) {
            res.send(this.minify(data), this.options.headers);
        } else {
            res.send(data, this.options.headers);
        }
    }.bind(this));
};

Mirror.prototype.minify = function(data) {
    if (this.options.type == '.js') {
        var ast = uglify.parser.parse(data);
        ast = uglify.uglify.ast_mangle(ast);
        ast = uglify.uglify.ast_squeeze(ast);
        return uglify.uglify.gen_code(ast);
    }

    return data;
};

Mirror.prototype.load = function(callback) {
    if (!this.assets.length) return callback(null, '');

    if (this.options.sort) this.options.sort(this.assets);

    var result = [];
    var pending = this.assets.length;
    var cancelled = false;

    var done = function() {
        if (this.options.wrapper) for (var i = 0; i < result.length; i++) {
            result[i] = this.options.wrapper(result[i],
                    typeof this.assets[i] === 'string' ? this.assets[i] : null, this.options);
        }
        if (Mirror.wrappers[this.options.type]) for (var i = 0; i < result.length; i++) {
            result[i] = Mirror.wrappers[this.options.type](result[i],
                    typeof this.assets[i] === 'string' ? this.assets[i] : null, this.options);
        }
        callback(null, result.join(this.options.separator));
    }.bind(this);

    this.assets.forEach(function(asset, i) {
        if (typeof asset.load === 'function') asset.load(loaded);
        else fs.readFile(asset, 'utf8', loaded);
        function loaded(err, data) {
            if (cancelled) { return; }
            if (err) { cancelled = true; return callback(err); }
            result[i] = data;
            if (!--pending) done();
        }
    });
};

Mirror.source = function(source) {
    return {
        load: function(callback) {
            callback(null, source);
        }
    };
};
