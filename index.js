var path = require('path'),
    fs = require('fs'),
    Step = require('step'),
    resolved = {};

var resolve = function(m) {
    if (resolved[m] === undefined) {
        try {
            require(m);
            for (var key in module.parent.moduleCache) {
                var cache = module.parent.moduleCache[key];
                if (cache.id === m) {
                    resolved[m] = path.dirname(cache.filename);
                    break;
                }
            }
        } catch(e) {
            throw new Error('Require ' + m + 'failed.');
        }
    }
    return resolved[m];
};

var assets = function(assets, headers) {
    (typeof assets === 'string') && (assets = [assets]);
    headers = headers || {'Content-Type': 'text/javascript'};
    return function(req, res, next) {
        Step(
            function() {
                var group = this.group();
                for (var i = 0; i < assets.length; i++) {
                    var split = assets[i].split('/'),
                        module = split.shift(),
                        basepath = resolve(module),
                        filepath = split.join('/');
                    fs.readFile(path.join(basepath, filepath), 'utf8', group());
                }
            },
            function(err, data) {
                if (err) next(new Error('Failed to load assets.'));
                res.send(data.join('\n'), headers);
            }
        );
    };
};

var file = function(asset) {
    var split = asset.split('/'),
        module = split.shift(),
        filename = split.join('/');
    return function(req, res, next) {
        res.sendfile(path.join(resolve(module), filename));
    };
};

module.exports = {
    assets: assets,
    file: file,
    resolve: resolve
};

