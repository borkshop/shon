
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

document = _ ('usage:' _)? name:name description:description* '\n'? document:termlines {
        document.name = name;
        description[0] = name + description[0];
        document.description = description;
        return document;
    }

description = !'\n' !( name ':' ) line:$([^\n]+) '\n'? {
        return line;
    }

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
        return {
            name: null,
            description: null,
            usage: usage,
            terms: map,
            parsers: {},
            converters: {},
            validators: {},
            collectors: {}
        };
    }

termline 'usage line' = _ name:name ':' _ term:usageline '\n'? {
        term.name = name;
        return term;
    }

line = term:usageline {
        delete term.usage;
        return term;
    }

usageline = term:(optional / required) type:type help:help {
        term.type = type;
        term.help = help;
        term.usage = text().trim();
        if (type === 'trump') {
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
            type: null,
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

type = ':' name:name _ {
        return name;
    } / '*' _ {
        return 'trump';
    } / _ {
        return null;
    }

help = help:$( !( '\n' ' '* name ':' ) . )* {
        return help.trim();
    }

number = $([1-9][0-9]*)

_ = ' '*
