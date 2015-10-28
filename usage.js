'use strict';

var PEG = require('pegjs');
var fs = require('fs');
var path = require('path');
var Result = require('rezult');

var parser;

function parse(usage) {
    if (!parser) {
        var filename = path.join(__dirname, 'usage.pegjs');
        var source = fs.readFileSync(filename, 'ascii');
        parser = PEG.buildParser(source);
    }
    try {
        return new Result(null, parser.parse(usage));
    } catch (error) {
        return new Result(error);
    }
}

exports.parse = parse;
