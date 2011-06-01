var mirror = exports;
var fs = require('fs');
var path = require('path');

mirror.headers = {
    '.js': 'text/javascript',
    '.css': 'text/css'
};

mirror.wrappers = {
    '.js': function(content, filename, options) {
        return '\n;' + content + '\n;'
    }
};

mirror.assets = function assets(assets, options) {
    if (!Array.isArray(assets)) assets = [ assets ];
    if (!options) options = {};
    if (!options.type) {
        if (assets.length) options.type = path.extname(assets[0]);
        else options.type = '.js';
    } else if (options.type[0] !== '.') {
        options.type = '.' + options.type;
    }
    if (!(maxAge in options)) options.maxAge = 3600; // 1 hour
    if (!options.headers) options.headers = {};

    options.headers['Content-Type'] = mirror.headers[options.type] || 'text/plain';
    options.headers['Cache-Control'] = 'max-age=' + options.maxAge;

    return function(req, res, next) {
        var data = [];
        if (!assets.length) return done();

        if (options.sort) options.sort(assets);

        var pending = assets.length, cancelled = false;
        for (var i = 0; i < assets.length; i++) {
            fs.readFile(assets[i], 'utf8', function(err, file) {
                if (err) {
                    cancelled = true;
                    next(err);
                } else if (!cancelled) {
                    if (options.wrapper) {
                        file = options.wrapper(file, assets[this], options);
                    }
                    if (mirror.wrappers[options.type]) {
                        file = mirror.wrappers[options.type](file, assets[this], options);
                    }
                    data[this] = file;
                    if (!--pending) done();
                }
            }.bind(i));
        }

        function done() {
            res.send(data.join('\n'), options.headers);
        }
    };
};

mirror.source = function source(sources, options) {
    if (!Array.isArray(sources)) sources = [ sources ];
    if (!options) options = {};
    if (!options.headers) options.headers = {};
    if (!(maxAge in options)) options.maxAge = 3600; // 1 hour
    if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'text/javascript';
    }
    options.headers['Cache-Control'] = 'max-age=' + options.maxAge;

    return function(req, res, next) {
        res.send(sources.map(function(file) {
            if (options.wrapper) {
                return options.wrapper(file.content, file.filename);
            } else {
                return file.content;
            }
        }).join('\n'), options.headers);
    };
};
