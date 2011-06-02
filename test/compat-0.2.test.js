var assert = require('assert');
var express = require('express');
var mirror = require('..');


function contentType(type) {
    return function(res) {
        assert.equal(res.headers['content-type'], type);
    };
}

var server = express.createServer();




var assets3 = mirror.assets([
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


var assets13 = mirror.source([
    {
        filename: 'red.css',
        content: '#foo { color: red; }'
    }, {
        filename: 'blue.css',
        content: '#bar { color: blue; }'
    }
], { type: '.css' });
server.get('/assets/13', assets13);

exports['test file serving 13'] = function() {
    assert.response(server, {
        url: '/assets/13'
    }, {
        body: '#foo { color: red; }\n#bar { color: blue; }',
        status: 200
    }, contentType('text/css; charset=utf-8'))
};