var assert = require('assert');
var express = require('express');
var mirror = require('..');


function contentType(type) {
    return function(res) {
        assert.equal(res.headers['content-type'], type);
    };
}

var server = express.createServer();


exports['test creation failure'] = function() {
    assert.throws(function() {
        new mirror();
    }, /First parameter must be an array/);
};


var assets1 = new mirror([]);
server.get('/assets/1', assets1);

exports['test file serving 1'] = function() {
    assert.response(server, {
        url: '/assets/1'
    }, {
        body: '',
        status: 200
    }, contentType('text/plain; charset=utf-8'))
};


var assets2 = new mirror([
    __dirname + '/fixtures/foo.js'
]);
server.get('/assets/2', assets2);

exports['test file serving 2'] = function() {
    assert.response(server, {
        url: '/assets/2'
    }, {
        body: '\n;alert("Hello World");\n;',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};


var assets3 = new mirror([
    __dirname + '/fixtures/foo.js',
    __dirname + '/fixtures/bar.js',
    __dirname + '/fixtures/baz.js',
]);
server.get('/assets/3', assets3);

exports['test file serving 3'] = function() {
    assert.response(server, {
        url: '/assets/3'
    }, {
        body: '\n;alert("Hello World");\n;\n\n;alert("Hello bar");\n;\n\n;alert("Hello baz");\n;',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};


var assets4 = new mirror([
    __dirname + '/fixtures/foo.js',
    mirror('foo();')
]);
server.get('/assets/4', assets4);

exports['test file serving 4'] = function() {
    assert.response(server, {
        url: '/assets/4'
    }, {
        body: '\n;alert("Hello World");\n;\n\n;foo();\n;',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};


var assets5 = new mirror([
    __dirname + '/fixtures/foo.css',
    mirror('#foo { color: red; }')
], { type: '.css' });
server.get('/assets/5', assets5);

exports['test file serving 5'] = function() {
    assert.response(server, {
        url: '/assets/5'
    }, {
        body: 'body { font-family: Helvetica; }\n#foo { color: red; }',
        status: 200
    }, contentType('text/css; charset=utf-8'))
};


// Test nested mirrors with first item a mirror (should return text/plain)
var assets6 = new mirror([
    new mirror([
        __dirname + '/fixtures/foo.js',
        __dirname + '/fixtures/bar.js'
    ]),
    __dirname + '/fixtures/baz.js'
]);
server.get('/assets/6', assets6);

exports['test file serving 6'] = function() {
    assert.response(server, {
        url: '/assets/6'
    }, {
        body: '\n;alert("Hello World");\n;\n\n;alert("Hello bar");\n;\nalert("Hello baz");',
        status: 200
    }, contentType('text/plain; charset=utf-8'))
};


// Test nested mirrors.
var assets7 = new mirror([
    new mirror([
        __dirname + '/fixtures/foo.js',
        __dirname + '/fixtures/bar.js'
    ]),
    __dirname + '/fixtures/baz.js'
], { type: '.js' });
server.get('/assets/7', assets7);

exports['test file serving 7'] = function() {
    assert.response(server, {
        url: '/assets/7'
    }, {
        body: '\n;\n;alert("Hello World");\n;\n\n;alert("Hello bar");\n;\n;\n\n;alert("Hello baz");\n;',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};


// Test nested mirrors with second item a mirror (should return application/javascript)
var assets8 = new mirror([
    __dirname + '/fixtures/baz.js',
    new mirror([
        __dirname + '/fixtures/foo.js',
        __dirname + '/fixtures/bar.js'
    ]),
]);
server.get('/assets/8', assets8);

exports['test file serving 8'] = function() {
    assert.response(server, {
        url: '/assets/8'
    }, {
        body: '\n;alert("Hello baz");\n;\n\n;\n;alert("Hello World");\n;\n\n;alert("Hello bar");\n;\n;',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};


// Test wrapping
var assets9 = new mirror([
    __dirname + '/fixtures/bar.js'
], {
    wrapper: function wrapFn(content, filename, options) {
        assert.equal(content, 'alert(\"Hello bar\");');
        assert.equal(filename, __dirname + '/fixtures/bar.js');
        assert.equal(options.wrapper, wrapFn);
        return 'compressed content';
    }
});
server.get('/assets/9', assets9);

exports['test file serving 9'] = function() {
    assert.response(server, {
        url: '/assets/9'
    }, {
        body: '\n;compressed content\n;',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};


// Test custom headers.
var assets10 = new mirror([
    mirror('\x00\x00\x00')
], {
    headers: { 'Content-Type': 'application/octet-stream' },
    separator: ''
});
server.get('/assets/10', assets10);

exports['test file serving 10'] = function() {
    assert.response(server, {
        url: '/assets/10'
    }, {
        body: '\0\0\0',
        status: 200
    }, contentType('application/octet-stream; charset=utf-8'))
};



// Test nested wrapping
var assets11 = new mirror([
    __dirname + '/fixtures/bar.js',
    new mirror([ mirror('content')], {
        wrapper: function wrapFn(content, filename, options) {
            assert.equal(content, 'content');
            assert.equal(filename, null);
            assert.equal(options.wrapper, wrapFn);
            return 'inner compressed content';
        }
    })
], {
    wrapper: function wrapFn(content, filename, options) {
        if (content === 'inner compressed content') return content;
        assert.equal(content, 'alert(\"Hello bar\");');
        assert.equal(filename, __dirname + '/fixtures/bar.js');
        assert.equal(options.wrapper, wrapFn);
        return 'compressed content';
    }
});
server.get('/assets/11', assets11);

exports['test file serving 11'] = function() {
    assert.response(server, {
        url: '/assets/11'
    }, {
        body: '\n;compressed content\n;\n\n;inner compressed content\n;',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};

// Test uglifying JS
var assets12 = new mirror([
    __dirname + '/fixtures/sample.js'
], { minify: true });
server.get('/assets/12', assets12);

exports['test file serving 12'] = function() {
    assert.response(server, {
        url: '/assets/12'
    }, {
        body: 'function baz(a){var b=a;return b}',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};

var assets13 = new mirror([
    mirror('#foo { color: red; }'),
    mirror(function(callback, req, res) {
        callback(null, '/*' + req.url + '*/ #bar { color: blue; }');
    })
], { type: '.css' });
server.get('/assets/13', assets13);

exports['test file serving 13'] = function() {
    assert.response(server, {
        url: '/assets/13'
    }, {
        body: '#foo { color: red; }\n/*/assets/13*/ #bar { color: blue; }',
        status: 200
    }, contentType('text/css; charset=utf-8'))
};
