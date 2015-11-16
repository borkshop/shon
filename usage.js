'use strict';

var Result = require('rezult');
var parser = require('./usage-parser');

function parse(usage) {
    try {
        return new Result(null, parser.parse(usage));
    } catch (error) {
        return new Result(error);
    }
}

exports.parse = parse;
