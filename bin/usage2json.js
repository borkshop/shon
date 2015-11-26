#!/usr/bin/env node
'use strict';

var Command = require('..');
var parser = require('../usage-parser');
var fs = require('fs');
var path = require('path');

var command = new Command('usage2json', {
    path: '<usagefile>'
});

var config = command.exec();

var usage = fs.readFileSync(config.path, 'utf8');

try {
    var json = parser.parse(usage, {startRule: 'document'});
} catch (error) {
    console.log(
        config.path + ':' +
        error.location.start.line + ':' +
        error.location.start.column + ': ' +
        error.message
    );
    process.exit(-1);
}

console.log(JSON.stringify(json, null, 2));
