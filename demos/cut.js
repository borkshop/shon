'use strict';

var Command = require('..');

var command = new Command('cut', {
    delim: '[-d <delim>]',
    fields: '[-f <fields>...]'
});

command.delim.default = ' ';

command.fields.converter = function convert(fields) {
    var parts = fields.split(',');
    return parts.map(Number);
};

command.fields.validator = function validate(fields) {
    return fields.every(isNumber);
};

function isNumber(number) {
    return number === number; // Just excludes NaN
}

var config = command.exec();

process.stdin.setEncoding('utf-8');
process.stdin.on('data', function (line) {
    var parts = line.trim().split(config.delim);
    console.log(config.fields.map(function get(field) {
        return parts[field - 1];
    }).join(config.delim));
});
