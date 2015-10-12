'use strict';

var test = require('tape');
var Command = require('../command');
var Delegate = require('./delegate');

function commandCases(setup, cases) {
    return function t(assert) {
        var command = new Command('dwim');
        setup(command);

        for (var index = 0; index < cases.length; index++) {
            var c = cases[index];
            var delegate = new Delegate(assert, c.logs || {});
            var options = command.parse(c.args, 0, delegate);
            assert.deepEquals(options, c.options, c.name);
        }

        assert.end();
    };
}

test('command with -b --bool boolean flag', commandCases(function c(command) {
    command.option('-b', '--bool');
}, [

    {
        name: 'degenerate case',
        args: [],
        options: {
            bool: false
        },
        logs: {}
    },

    {
        name: 'provided with short option',
        args: ['-b'],
        options: {
            bool: true
        },
        logs: {}
    },

    {
        name: 'provided with long option',
        args: ['--bool'],
        options: {
            bool: true
        },
        logs: {}
    },

    {
        name: 'warn on redudnancy with long options',
        args: ['--bool', '--bool'],
        options: {
            bool: true
        },
        logs: {
            warn0: 'Redundant: bool'
        }
    },

    {
        name: 'warn on redudnancy with short options',
        args: ['-bb'],
        options: {
            bool: true
        },
        logs: {
            warn0: 'Redundant: bool'
        }
    },

]));

test('command with required -b --bool boolean flag', commandCases(function c(command) {
    command.option('-b', '--bool')
        .required();
}, [

    {
        name: 'missing',
        args: [],
        options: {
            bool: false
        },
        logs: {
            error0: 'Expected: bool'
        }
    },

]));

test('command with single value option', commandCases(function c(command) {
    command.option('-k', '--key', 'value');
}, [

    {
        name: 'elided',
        args: [],
        options: {
            key: null
        }
    },

    {
        name: 'provided with short',
        args: ['-k', 'value'],
        options: {
            key: 'value'
        }
    },

    {
        name: 'provided with long',
        args: ['--key', 'value'],
        options: {
            key: 'value'
        }
    },

    {
        name: 'provided with long in --key=value style',
        args: ['--key=value'],
        options: {
            key: 'value'
        }
    },

    {
        name: 'redundant with short',
        args: ['-kk', 'value', 'value'],
        options: {
            key: 'value'
        },
        logs: {
            warn0: 'Redundant: key'
        }
    },

    {
        name: 'redundant with short but missing parse value',
        args: ['-kk', 'value'],
        options: {
            key: 'value'
        },
        logs: {
            error0: 'Expected: value'
        }
    },

]));

test('command that accepts arguments on short options', commandCases(function c(command) {
    command.shortArguments().option('-k', 'value').name('key');
}, [

    {
        name: 'accepting value on short argument',
        args: ['-kvalue'],
        options: {
            key: 'value'
        }
    }

]));

test('command with multiple value option', commandCases(function c(command) {
    command.option('-k', '--key', 'value').push();
}, [

    {
        name: 'none provided',
        args: [],
        options: {
            key: []
        }
    },

    {
        name: 'one provided, using short',
        args: ['-k', 'value'],
        options: {
            key: ['value']
        }
    },

    {
        name: 'one provided, using conjoined shorts',
        args: ['-kk', '1', '2'],
        options: {
            key: ['1', '2']
        }
    },

    {
        name: 'one and half provided with conjoined shorts',
        args: ['-kk', '1'],
        options: {
            key: ['1']
        },
        logs: {
            error0: 'Expected: value'
        }
    },

]));

test('command that accepts multiple values on short options', commandCases(function c(command) {
    command.shortArguments().option('-k', 'value').name('key').push();
}, [

    {
        name: 'accepting value on short argument',
        args: ['-k1', '-k2'],
        options: {
            key: ['1', '2']
        }
    }

]));

// TODO values collector with minimum and maximum length
// TODO value or push values with a converter for int
// TODO value or push values with validator for value ranges
// TODO value or push values with converter provided as function
// TODO value or push values with validator provided as function

test('command with -h and --help commands', commandCases(function c(command) {
    command.command('-h', '--help');
}, [

    {
        name: 'degenerate case',
        args: [],
        options: {},
        logs: {}
    },

]));

// TODO command with subcommand options

