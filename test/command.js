'use strict';

var test = require('tape');
var commandCases = require('./cases');

test('command with -b --bool boolean flag', commandCases(function c(command) {
    command.option('-b', '--bool');
}, [

    {
        name: 'degenerate case',
        args: [],
        config: {
            bool: false
        },
        logs: {}
    },

    {
        name: 'provided with short option',
        args: ['-b'],
        config: {
            bool: true
        },
        logs: {}
    },

    {
        name: 'provided with long option',
        args: ['--bool'],
        config: {
            bool: true
        },
        logs: {}
    },

    {
        name: 'warn on redudnancy with long options',
        args: ['--bool', '--bool'],
        config: {
            bool: true
        },
        logs: {
            warn0: 'Redundant: bool'
        }
    },

    {
        name: 'warn on redudnancy with short options',
        args: ['-bb'],
        config: {
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
        config: null,
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
        config: {
            strict: true
        }
    },

    {
        name: 'provided',
        args: ['--no-strict'],
        config: {
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
        config: {
            key: null
        }
    },

    {
        name: 'provided with short',
        args: ['-k', 'value'],
        config: {
            key: 'value'
        }
    },

    {
        name: 'provided with long',
        args: ['--key', 'value'],
        config: {
            key: 'value'
        }
    },

    {
        name: 'provided with long in --key=value style',
        args: ['--key=value'],
        config: {
            key: 'value'
        }
    },

    {
        name: 'redundant with short',
        args: ['-kk', 'value', 'value'],
        config: {
            key: 'value'
        },
        logs: {
            warn0: 'Redundant: key'
        }
    },

    {
        name: 'redundant with short but missing parse value',
        args: ['-kk', 'value'],
        config: null,
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
        config: {
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
        config: {
            key: []
        }
    },

    {
        name: 'one provided, using short',
        args: ['-k', 'value'],
        config: {
            key: ['value']
        }
    },

    {
        name: 'one provided, using conjoined shorts',
        args: ['-kk', '1', '2'],
        config: {
            key: ['1', '2']
        }
    },

    {
        name: 'one and half provided with conjoined shorts',
        args: ['-kk', '1'],
        config: null,
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
        config: {
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
        config: null,
        logs: {
            error0: 'Too few: value'
        }
    },

    {
        name: 'enough',
        args: ['-k', 'value'],
        config: {
            key: ['value']
        },
        logs: {
        }
    },

    {
        name: 'more than enough',
        args: ['-k', 'value', '-k', 'value'],
        config: {
            key: ['value', 'value']
        },
        logs: {
        }
    },

    {
        name: 'too many',
        args: ['-kkk', '1', '2', '3'],
        config: null,
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
        config: {
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
        config: {
            name: 'value'
        }
    },

    {
        name: 'missing',
        args: [],
        config: null,
        logs: {
            error0: 'Expected: name'
        }
    },

    {
        name: 'extra',
        args: ['good', 'bad'],
        config: null,
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
        config: null,
        logs: {
            error0: 'Expected: start',
            error1: 'Expected: stop',
            error2: 'Expected: step'
        }
    },

    {
        name: 'one missing',
        args: ['0', '10'],
        config: null,
        logs: {
            error0: 'Expected: step'
        }
    },

    {
        name: 'all accounted for',
        args: ['0', '10', '1'],
        config: {
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
        config: {
            numbers: []
        }
    },

    {
        name: 'a number',
        args: ['1'],
        config: {
            numbers: [1]
        }
    },

    {
        name: 'some numbers',
        args: ['1', '2', '3'],
        config: {
            numbers: [1, 2, 3]
        }
    },

    {
        name: 'invalid number',
        args: ['nope'],
        config: null,
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
        config: {
            f: false,
            command: {
                name: 'rm',
                config: {
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
        config: {
            f: true,
            command: {
                name: 'rm',
                config: {
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
        config: {
            f: false,
            command: {
                name: 'rm',
                config: {
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
        config: {
            f: true,
            command: {
                name: 'rm',
                config: {
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
        config: {
            f: false,
            command: {
                name: 'add',
                config: {
                }
            }
        },
        logs: {
        }
    },

    {
        name: 'unexpected suboption',
        args: ['add', '-f'],
        config: null,
        logs: {
            error0: 'Unexpected option: -f'
        }
    },

]));

