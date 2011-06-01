var fs = require('fs');
var path = require('path');

module.exports = exports = Mirror;
function Mirror(assets, options) {
    if (!Array.isArray(assets)) throw new Error('First parameter must be an array');
    if (!options) options = {};

    // Content-Type
    if (!options.type) {
        if (assets.length) options.type = path.extname(assets[0]);
        else options.type = '.js';
    } else if (options.type[0] !== '.') {
        options.type = '.' + options.type;
    }

    // Cache-Control
    if (!('maxAge' in options)) options.maxAge = 3600; // 1 hour

    // Setup header fields
    if (!options.headers) options.headers = {};
    options.headers['Content-Type'] = Mirror.headers[options.type] || 'text/plain';
    options.headers['Cache-Control'] = 'max-age=' + options.maxAge;

    this.assets = assets;
    this.options = options;
    this.handler = this.handler.bind(this);
    this.load = this.load.bind(this);
};

Mirror.headers = {
    '.js': 'application/javascript',
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
    var headers = this.options.headers;
    this.load(function(err, data) {
        if (err) next(err);
        else res.send(data, headers);
    });
};

Mirror.prototype.load = function(callback) {
    if (!this.assets.length) return callback(null, '');

    if (this.options.sort) this.options.sort(this.assets);

    var result = [];
    var pending = this.assets.length;
    var cancelled = false;

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

    var done = function() {
        if (this.options.wrapper) for (var i = 0; i < result.length; i++) {
            result[i] = this.options.wrapper(result[i], this.assets[i], this.options);
        }
        if (Mirror.wrappers[this.options.type]) for (var i = 0; i < result.length; i++) {
            result[i] = Mirror.wrappers[this.options.type](result[i], this.assets[i], this.options);
        }
        callback(null, result.join('\n'));
    }.bind(this);
};

Mirror.source = function(source) {
    return {
        load: function(callback) {
            callback(null, source);
        }
    };
};
