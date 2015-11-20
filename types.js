'use strict';

var fs = require('fs');
var streams = require('stream');
var ShonParser = require('./shon-parser');
var JshonParser = require('./jshon-parser');
var ArrayCollector = require('./array-collector');
var ValueCollector = require('./value-collector');
// TODO var DifferenceCollector = require('./difference-collector');
// TODO SetCollector

var types = {
    defaults: {
        input: defaultInput,
        atinput: defaultInput,
        output: defaultOutput
    },
    parsers: {
        shon: ShonParser,
        jshon: JshonParser,
    },
    converters: {
        number: Number,
        quantity: Number,
        boolean: convertBoolean,
        json: convertJson,
        input: InputConverter,
        atinput: AtInputConverter,
        output: OutputConverter
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
        delegate.cursor();
    }
}

function convertJson(string, iterator, delegate) {
    try {
        return JSON.parse(string);
    } catch (error) {
        delegate.error(error.message);
        delegate.cursor(-1);
        return null;
    }
}

function InputConverter(args) {
    this.encoding = args.encoding || 'utf8';
}

InputConverter.prototype.convert = function convert(value) {
    if (value === '-') {
        return defaultInput();
    } else {
        return fs.createReadStream(value, this.encoding);
    }
};

function defaultInput() {
    process.stdin.resume();
    return process.stdin;
}

function OutputConverter(args) {
    this.encoding = args.encoding || 'utf8';
}

OutputConverter.prototype.convert = function convert(value) {
    if (value === '-') {
        process.stdin.resume();
        return process.stdout;
    } else {
        return fs.createWriteStream(value, this.encoding);
    }
};

function defaultOutput() {
    return process.stdout;
}

function AtInputConverter(args) {
    this.encoding = args.encoding || 'utf8';
}

AtInputConverter.prototype.convert = function convert(value, iterator, delegate) {
    if (value.lastIndexOf('@', 0) === 0) {
        var path = value.slice(1);
        return InputConverter.prototype.convert.call(this, path, iterator, delegate);
    } else {
        var stream = new streams.Readable();
        stream.setEncoding(this.encoding);
        stream._read = noop;
        stream.push(value);
        stream.push(null);
        return stream;
    }
};

function noop() {}

module.exports = types;
