// [... -s|--long <arg>] Help

start = term:(optional / required) type:type help:help {
        term.help = help;
        term.validatorType = type.validator;
        term.converterType = type.converter;
        return term;
    }

optional = '[' _ term:required ']' _ {
        term.required = false;
        return term;
    }

required = flags:flags arg:arg collector:collector {
        return {
            name: null,
            flags: flags,
            arg: arg.name,
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

name = $([A-Za-z_-]+)

arg = '<' name:name '>' _ {
        return {name: name};
    } / _ {
        return {name: null};
    }

type = ':quantity' _ {
        return {converter: 'number', validator: 'positive'};
    } / ':number' _ {
        return {converter: 'number', validator: 'number'};
    } / ':boolean' _ {
        return {converter: 'boolean', validator: null};
    } / _ {
        return {converter: null, validator: null};
    }

help = help:$( ( _ ![\[ ] . )* ) _ {
        return help;
    }

number = $([1-9][0-9]*)

_ = ' '*
