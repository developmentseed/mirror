var assert = require('assert');
var express = require('express');
var mirror = require('..');


function contentType(type) {
    return function(res) {
        assert.equal(res.headers['content-type'], type);
    };
}

var server = express.createServer();



var assets1 = new mirror([]);
server.get('/assets/1', assets1.handler);

exports['test file serving 1'] = function() {
    assert.response(server, {
        url: '/assets/1'
    }, {
        body: '',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};


var assets2 = new mirror([
    __dirname + '/fixtures/foo.js'
]);
server.get('/assets/2', assets2.handler);

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
server.get('/assets/3', assets3.handler);

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
    mirror.source('foo();')
]);
server.get('/assets/4', assets4.handler);

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
    mirror.source('#foo { color: red; }')
], { type: '.css' });
server.get('/assets/5', assets5.handler);

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
server.get('/assets/6', assets6.handler);

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
server.get('/assets/7', assets7.handler);

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
server.get('/assets/8', assets8.handler);

exports['test file serving 8'] = function() {
    assert.response(server, {
        url: '/assets/8'
    }, {
        body: '\n;alert("Hello baz");\n;\n\n;\n;alert("Hello World");\n;\n\n;alert("Hello bar");\n;\n;',
        status: 200
    }, contentType('application/javascript; charset=utf-8'))
};