
// [-s|--long <arg>...] :type Help
// [-s|--long] <arg>... :type Help
// -s|--long <arg>... :type Help

// [ -s|--long ]
// [ -s|--long ] arg
// [ -s|--long arg ]
// [ arg ]
// -s|--long
// -s|--long arg
// arg

document = _ ('usage:' _)? name:$(nameline*) '\n'? document:termlines {
        document.name = name;
        return document;
    }

nameline = !'\n' !( name ':' ) [^\n]+ '\n'?

termlines = terms:termline* {
        var map = {};
        var usage = [];
        for (var index = 0; index < terms.length; index++) {
            var term = terms[index];
            usage.push(term.usage);
            map[term.name] = term;
            delete term.usage;
            delete term.name;
        }
        return {name: null, usage: usage, terms: map};
    }

termline 'usage line' = _ name:name ':' _ term:usageline '\n'? {
        term.name = name;
        return term;
    }

line = term:usageline {
        delete term.usage;
        return term;
    }

usageline = term:(optional / required) type:type trump:$('*' / '') help:help {
        term.validatorType = type.validator;
        term.converterType = type.converter;
        term.help = help;
        term.usage = text();
        if (trump === '*') {
            term.trump = true;
        }
        return term;
    }

optional = '[' _ tail:optional_tail { return tail; }

optional_tail = flags:flags ']' _ arg:arg tail:tail {
        tail.flags = flags;
        tail.arg = arg.name;
        tail.optionalFlag = true;
        return tail;
    } / flags:flags arg:arg tail:tail ']' _ {
        tail.flags = flags;
        tail.arg = arg.name;
        tail.required = false;
        return tail;
    } / flags:flags tail:tail ']' _ {
        tail.flags = flags;
        tail.required = false;
        return tail;
    }

required = flags:flags term:required_tail {
        term.flags = flags;
        return term;
    }

required_tail = arg:arg tail:tail {
        tail.arg = arg.name;
        return tail;
    } / tail:tail {
        return tail;
    }

tail = collector:collector {
        return {
            name: null,
            flags: null,
            arg: null,
            command: null,
            collectorType: collector.type,
            validatorType: null,
            converterType: null,
            required: true,
            minLength: collector.minLength,
            maxLength: collector.maxLength,
            help: null
        };
    }

collector = '...' _ {
        return {
            type: 'array',
            minLength: 0,
            maxLength: Infinity
        };
    } / '{' _ minLength:number '..' maxLength:number '}' _ {
        return {
            type: 'array',
            minLength: +minLength,
            maxLength: +maxLength
        };
    } / '{' _ minLength:number '..}' _ {
        return {
            type: 'array',
            minLength: +minLength,
            maxLength: Infinity
        };
    } / '{' _ quantity:number  '}' _ {
        return {
            type: 'array',
            minLength: +quantity,
            maxLength: +quantity
        };
    } / _ {
        return {
            type: null,
            minLength: null,
            maxLength: null
        }
    }

flags = head:flag tail:( '|' flag:flag { return flag; })* _ {
        return [head].concat(tail);
    }
    / _ {
        return [];
    }

flag = flag:(long / short) implies:implies {
        if (implies !== null) {
            flag.value = implies.value;
            if (implies.default) {
                flag.default = true;
            }
        }
        return flag;
    }

implies = '=' value:$([a-z]*) def:$('*')? {
        var implies = {value: value};
        if (def === '*') {
            implies.default = true;
        }
        return implies;
    } / _ {
        return null;
    }

long = flag:$('--' name) {
        return {flag: flag, long: true};
    }

short = flag:$('-' name) {
        return {flag: flag, short: true};
    }

name = $([A-Za-z0-9_-]+)

arg = '<' name:name '>' _ {
        return {name: name};
    }

type = ':quantity' _ {
        return {converter: 'number', validator: 'positive'};
    } / ':number' _ {
        return {converter: 'number', validator: 'number'};
    } / ':boolean' _ {
        return {converter: 'boolean', validator: null};
    } / ':shon' _ {
        return {converter: 'shon', validator: null};
    } / ':json' _ {
        return {converter: 'json', validator: null};
    } / ':jshon' _ {
        return {converter: 'jshon', validator: null};
    } / _ {
        return {converter: null, validator: null};
    }

help = [ \n]* help:$( ( _ !( [\[ ] ) !( '\n' _ name ':' ) . )* ) _ {
        return help;
    }

number = $([1-9][0-9]*)

_ = ' '*
