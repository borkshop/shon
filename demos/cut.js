'use strict';

var Command = require('..');

var command = new Command('cut', {
    delim: '[-d <delim>]',
    fields: '[-f <fields>]',
    inputs: '[<file>{1..}] :input',
    output: '[-o <file>] :output'
});

command.delim.default = ' ';
command.fields.default = [];

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

config.inputs.forEach(onInput);

function onInput(input) {

    var remainder = '';
    input.on('data', function (line) {
        remainder += line;
        flush();
    });
    input.on('end', function () {
        if (remainder) {
            remainder += '\n';
            flush();
        }
    });

    function flush(end) {
        for (;;) {
            var index = remainder.indexOf('\n');
            if (index < 0) {
                break;
            }
            var line = remainder.slice(0, index);
            onLine(line);
            remainder = remainder.slice(index + 1);
        }
    }
}

function onLine(line) {
    var parts = line.trim().split(config.delim);
    config.output.write(config.fields.map(function get(field) {
        return parts[field - 1];
    }).join(config.delim) + '\n');
}
