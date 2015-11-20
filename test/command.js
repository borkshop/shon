'use strict';

var test = require('tape');
var Cursor = require('../cursor');
var Iterator = require('../iterator');
var Command = require('../command');
var parse = require('../parse');
var Delegate = require('./delegate');

function cases(command, cases) {
    return function t(assert) {
        for (var index = 0; index < cases.length; index++) {
            var c = cases[index];
            assert.comment(c.name);
            var delegate = new Delegate(assert, c.logs || {});
            var cursor = new Cursor(c.args, 0);
            var iterator = new Iterator(cursor);
            var config = parse(command, iterator, delegate);
            assert.deepEquals(config, c.config, c.name);
            delegate.end();
        }

        assert.end();
    };
}

test('optional boolean flag', cases(new Command('dwim', {
    bool: '[-b|--bool]'
}), [

    {
        name: 'degenerate case',
        args: [],
        config: {
            bool: false
        },
        logs: {}
    },

    {
        name: 'provided with short flag',
        args: ['-b'],
        config: {
            bool: true
        },
        logs: {}
    },

    {
        name: 'provided with long flag',
        args: ['--bool'],
        config: {
            bool: true
        },
        logs: {}
    },

    {
        name: 'warn on redudnancy with long flags',
        args: ['--bool', '--bool'],
        config: {
            bool: true
        },
        logs: {
            warn0: 'Redundant: bool'
        }
    },

    {
        name: 'warn on redudnancy with short flags',
        args: ['-bb'],
        config: {
            bool: true
        },
        logs: {
            warn0: 'Redundant: bool'
        }
    }

]));

test('optional argument', cases(new Command('dwim', {
    arg: '[<arg>]'
}), [

    {
        name: 'defaults when omitted',
        args: [],
        config: {
        }
    }

]));

test('required boolean flag', cases(new Command('dwim', {
    bool: '-b|--bool'
}), [

    {
        name: 'missing required flag',
        args: [],
        config: null,
        logs: {
            error0: 'Required: bool'
        }
    }

]));

test('flag with --no-flag', cases(new Command('dwim', {
    strict: '[--no-strict=false|--strict=true*] :boolean'
}), [

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

test('command with optional single value flag', cases(new Command('dwim', {
    key: '[-k|--key <value>]'
}), [

    {
        name: 'elided',
        args: [],
        config: {
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
        name: 'accepting value on short argument',
        args: ['-kvalue'],
        config: {
            key: 'value'
        }
    }

]));

test('command with required single value flag', cases(new Command('dwim', {
    value: '-k|--key <value>'
}), [

    {
        name: 'missing required flag',
        args: [],
        config: null,
        logs: {
            error0: 'Expected: value'
        }
    }

]));

test('command with multiple value flag', cases(new Command('dwim', {
    key: '-k|--key <value>...'
}), [

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
    }

]));

test('command that accepts multiple values on short flags', cases(new Command('dwim', {
    key: '-k <value> ...'
}), [

    {
        name: 'accepting value on short argument',
        args: ['-k1', '-k2'],
        config: {
            key: ['1', '2']
        }
    }

]));

test('command with minimum and maximum of an flag', cases(new Command('dwim', {
    key: '-k <value> {1..2}'
}), [

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
        args: ['-k1', '-k2', '-k3'],
        config: null,
        logs: {
            error0: 'Too many: value'
        }
    },

]));

test('command with quantity type', cases(new Command('dwim', {
    integer: '-i <quantity> :quantity'
}), [

    {
        name: 'converts an integer',
        args: ['-i', '100'],
        config: {
            integer: 100
        }
    },

    {
        name: 'fails to convert negative value',
        args: ['-i', '-100'],
        config: null,
        logs: {
            error0: 'Invalid: quantity'
        }
    },

    {
        name: 'fails to convert non-number',
        args: ['-i', 'not a number'],
        config: null,
        logs: {
            error0: 'Invalid: quantity'
        }
    }

]));

test('command with boolean type', cases(new Command('dwim', {
    toBe: '-b <bool> :boolean'
}), [

    {
        name: 'recognizes truth',
        args: ['-b', 'true'],
        config: {toBe: true}
    },

    {
        name: 'recognizes falsehood',
        args: ['-b', 'false'],
        config: {toBe: false}
    },

    {
        name: 'recognizes invalid boolean',
        args: ['-b', 'maybe'],
        config: null,
        logs: {
            error0: 'Must be true or false'
        }
    },

]));

var convertible = new Command('dwim', {
    integer: '-i <integer>'
});
convertible.integer.converter = Number;

test('command with converter', cases(convertible, [

    {
        name: 'converts an integer',
        args: ['-i', '100'],
        config: {
            integer: 100
        }
    }

]));

test('command accepts required argument', cases(new Command('dwim', {
    name: '<name>'
}), [

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
            error0: 'Unexpected argument: "bad"'
        }
    }


]));

test('command accepts multiple arguments', cases(new Command('dwim', {
    start: '<start> :number',
    stop: '<stop> :number',
    step: '<step> :number'
}), [

    {
        name: 'all missing',
        args: [],
        config: null,
        logs: {
            error0: 'Expected: start'
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

test('command accepts variadic arguments', cases(new Command('dwim', {
    numbers: '<number>... :number'
}), [

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
            error0: 'Invalid: number'
        }
    }

]));

test('command with flags subcommand and flags', cases(new Command('dwim', {
    force: '[-f]',
    command: {
        rm: {
            force: '[-f]'
        },
        add: {
        }
    }
}), [

    {
        name: 'neither before nor after',
        args: ['rm'],
        config: {
            force: false,
            command: {
                name: 'rm',
                config: {
                    force: false
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
            force: true,
            command: {
                name: 'rm',
                config: {
                    force: false
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
            force: false,
            command: {
                name: 'rm',
                config: {
                    force: true
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
            force: true,
            command: {
                name: 'rm',
                config: {
                    force: true
                }
            }
        },
        logs: {
        }
    },

    {
        name: 'independent flag profile per command',
        args: ['add'],
        config: {
            force: false,
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
        name: 'unexpected subflag',
        args: ['add', '-f'],
        config: null,
        logs: {
            error0: 'Unexpected flag: "-f"'
        }
    },

    {
        name: 'unrecognized command',
        args: ['ls'],
        config: null,
        logs: {
            error0: 'Unknown command: ls'
        }
    },

    {
        name: 'expected command',
        args: ['-f'],
        config: null,
        logs: {
            error0: 'Expected a command'
        }
    }

]));

var defaultPositional = new Command('nom', {
    first: '<first> :number',
    second: '<second> :number'
});

defaultPositional.first.default = 10;
defaultPositional.second.default = 20;

var defaultPositionalCases = [

    {
        name: 'defaults both',
        args: [],
        config: {
            first: 10,
            second: 20
        }
    },

    {
        name: 'accepts first, defaults second',
        args: ['0'],
        config: {
            first: 0,
            second: 20
        }
    },

    {
        name: 'accepts both',
        args: ['0', '1'],
        config: {
            first: 0,
            second: 1
        }
    }

];

var reincarnate = JSON.parse(JSON.stringify(defaultPositional));

test('positional arguments may have defaults', cases(defaultPositional, defaultPositionalCases));
test('round trips command description through JSON', cases(reincarnate, defaultPositionalCases));

test('trump flags', cases(new Command('helpful', {
    help: '[-h|--help]*'
}), [

    {
        name: 'trump flag',
        args: ['-h'],
        config: 'help'
    },

    {
        name: 'without trump flag, does not include in config',
        args: [],
        config: {}
    }

]));
