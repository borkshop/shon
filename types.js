'use strict';

var ShonParser = require('./shon-parser');
var JshonParser = require('./jshon-parser');
var ArrayCollector = require('./array-collector');
// TODO var DifferenceCollector = require('./difference-collector');
// TODO SetCollector

var types = {
    parsers: {
        shon: ShonParser,
        jshon: JshonParser,
    },
    converters: {
        number: Number,
        quantity: Number,
        boolean: convertBoolean,
        json: convertJson
    },
    validators: {
        number: isNumber,
        quantity: isPositive
    },
    collectors: {
        array: ArrayCollector
    }
};

function isPositive(number) {
    return number === number && number >= 0;
}

function isNumber(number) {
    return number === number;
}

function convertBoolean(string, iterator, delegate) {
    if (string === 'true') {
        return true;
    } else if (string === 'false') {
        return false;
    } else {
        delegate.error('Must be true or false');
        delegate.cursor(iterator.cursor);
    }
}

function convertJson(string, iterator, delegate) {
    try {
        return JSON.parse(string);
    } catch (error) {
        delegate.error(error.message);
        delegate.cursor(iterator.cursor, -1);
        return null;
    }
}

module.exports = types;
