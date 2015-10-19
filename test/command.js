'use strict';

var test = require('tape');
var commandCases = require('./cases');

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
        options: null,
        logs: {
            error0: 'Required: bool'
        }
    },

]));

test('option with --no-flag', commandCases(function c(command) {
    command.option('--no-strict');
}, [

    {
        name: 'missing',
        args: [],
        options: {
            strict: true
        }
    },

    {
        name: 'provided',
        args: ['--no-strict'],
        options: {
            strict: false
        }
    }

]));

test('command with single value option', commandCases(function c(command) {
    command.option('-k', '--key', '<value>');
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
        options: null,
        logs: {
            error0: 'Expected: value'
        }
    },

]));

test('command that accepts arguments on short options', commandCases(function c(command) {
    command.option('key', '-k<value>');
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
    command.option('-k', '--key', '<value>').push();
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
        options: null,
        logs: {
            error0: 'Expected: value'
        }
    },

]));

test('command that accepts multiple values on short options', commandCases(function c(command) {
    command.option('-k<value>').name('key').push();
}, [

    {
        name: 'accepting value on short argument',
        args: ['-k1', '-k2'],
        options: {
            key: ['1', '2']
        }
    }

]));

test('command with minimum and maximum of an option', commandCases(function c(command) {
    command.option('-k', 'key', '<value>').push(1, 2);
}, [

    {
        name: 'too few',
        args: [],
        options: null,
        logs: {
            error0: 'Too few: value'
        }
    },

    {
        name: 'enough',
        args: ['-k', 'value'],
        options: {
            key: ['value']
        },
        logs: {
        }
    },

    {
        name: 'more than enough',
        args: ['-k', 'value', '-k', 'value'],
        options: {
            key: ['value', 'value']
        },
        logs: {
        }
    },

    {
        name: 'too many',
        args: ['-kkk', '1', '2', '3'],
        options: null,
        logs: {
            error0: 'Too many: value'
        }
    },

]));

test('command with converter', commandCases(function c(command) {
    command.option('-i', '<integer>')
        .convert(Number);
}, [

    {
        name: 'converts an integer',
        args: ['-i', '100'],
        options: {
            integer: 100
        }
    }

]));

test('command accepts required argument', commandCases(function c(dwim) {
    dwim.argument('<name>');
}, [

    {
        name: 'provided',
        args: ['value'],
        options: {
            name: 'value'
        }
    },

    {
        name: 'missing',
        args: [],
        options: null,
        logs: {
            error0: 'Expected: name'
        }
    },

    {
        name: 'extra',
        args: ['good', 'bad'],
        options: null,
        logs: {
            error0: 'Unexpected argument: bad'
        }
    }


]));

test('command accepts multiple arguments', commandCases(function c(dwim) {
    dwim.argument('<start>').int();
    dwim.argument('<stop>').int();
    dwim.argument('<step>').int();
}, [

    {
        name: 'all missing',
        args: [],
        options: null,
        logs: {
            error0: 'Expected: start',
            error1: 'Expected: stop',
            error2: 'Expected: step'
        }
    },

    {
        name: 'one missing',
        args: ['0', '10'],
        options: null,
        logs: {
            error0: 'Expected: step'
        }
    },

    {
        name: 'all accounted for',
        args: ['0', '10', '1'],
        options: {
            start: 0,
            stop: 10,
            step: 1
        }
    }

]));

test('command accepts variadic arguments', commandCases(function c(dwim) {
    dwim.argument('numbers', '<number>')
        .convert(Number)
        .validate(function isNumber(arg) {
            return +arg === arg;
        })
        .push();
}, [

    {
        name: 'no numbers',
        args: [],
        options: {
            numbers: []
        }
    },

    {
        name: 'a number',
        args: ['1'],
        options: {
            numbers: [1]
        }
    },

    {
        name: 'some numbers',
        args: ['1', '2', '3'],
        options: {
            numbers: [1, 2, 3]
        }
    },

    {
        name: 'invalid number',
        args: ['nope'],
        options: null,
        logs: {
            error0: 'Expected: number'
        }
    }

]));

test('command with options subcommand and options', commandCases(function c(dwim) {
    dwim.option('-f');
    var rm = dwim.command('rm')
    rm.option('-f');
    var add = dwim.command('add');
}, [

    {
        name: 'neither before nor after',
        args: ['rm'],
        options: {
            f: false,
            command: {
                name: 'rm',
                options: {
                    f: false
                }
            }
        },
        logs: {
        }
    },

    {
        name: 'before',
        args: ['-f', 'rm'],
        options: {
            f: true,
            command: {
                name: 'rm',
                options: {
                    f: false
                }
            }
        },
        logs: {
        }
    },

    {
        name: 'after',
        args: ['rm', '-f'],
        options: {
            f: false,
            command: {
                name: 'rm',
                options: {
                    f: true
                }
            }
        },
        logs: {
        }
    },

    {
        name: 'before and after',
        args: ['-f', 'rm', '-f'],
        options: {
            f: true,
            command: {
                name: 'rm',
                options: {
                    f: true
                }
            }
        },
        logs: {
        }
    },

    {
        name: 'independent option profile per command',
        args: ['add'],
        options: {
            f: false,
            command: {
                name: 'add',
                options: {
                }
            }
        },
        logs: {
        }
    },

    {
        name: 'unexpected suboption',
        args: ['add', '-f'],
        options: null,
        logs: {
            error0: 'Unexpected option: -f'
        }
    },

]));

