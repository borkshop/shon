
# shon

Shon is a JavaScript command-line argument parser.
Fully describe your command's interface using familiar usage notation.
Since the declarations are complete, Shon can provide informative errors for
all missing or invalid configuration values.
Shon supports both optional and required flags and arguments, as well as
subcommands.

Shon also supports a recursive descent parser for Shell Object Notation (SHON),
so complex objects can be expressed as command line arguments.

## Installation

```
$ npm install --save shon
```

## Common Boolean Flags

A boolean flag is an option that switches a config value from false to true.

```js
var Command = require('shon/command');
var command = new Command('dwim', {
    bool: '[-b|--bool] A boolean flag'
});

var config = command.exec();
console.log(config.bool);
```

```
$ dwim
false

$ dwim -b
true
```

A boolean flag should only be provided once.

```
$ dwim -bb
Redundant: bool
dwim -b -b
        ^
usage: dwim
  [-b|--bool] A boolean flag
```

## Troll

The Bridge Troll accepts three required arguments.
They can be taken by position, or in any order with flags.
The last argument is a number, so the `:quantity` type annotation ensures that
the value on the command line is converted to a number and is a valid, positive
number. The `:number` annotation merely validates that the value is a number.

```js
var command = new Command('troll\n' +
    'Answer me these questions three, ere the other side ye see.', {
    name: '[-n|--name] <name> What is your name?',
    color: '[-c|--color] <color> What is your favorite colour?',
    airspeed: '[-a|--airspeed] <airspeed> :quantity What is the average ' +
        'airspeed velocity of an unladen swallow?'
});

var config = command.exec();

console.log('Name:', config.name);
console.log('Color:', config.color);
console.log('Airpseed:', config.airspeed);
```

The square brackets around the flags denote that the flag is optional but the
argument is not.

## Cut

The cut command accepts two optional arguments with custom default values, a
custom converter, and a custom validator.
The square brackets around the flag and argument denote that the argument is
optional and must be specified with the flag.

```js
'use strict';

var Command = require('shon/command');

var command = new Command('cut', {
    delim: '[-d <delim>] The delimiter to split on, space by default',
    fields: '[-f <fields>] Comma separated field numbers',
    input: '[<file>{1..}] :input The file or files to read, or standard input'
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

// using config.delim and config.fields...
// see demos/cut.js
config.input.forEach(onInput);
```

## Sum

The sum command accepts any number of arguments and computes their sum.

```js
var Command = require('shon/command');
var command = new Command('sum computes the sum of multiple numbers', {
    numbers: '<number>... :number'
});
var config = command.exec();
console.log(config.numbers.reduce(function add(a, b) {
    return a + b;
}));
```

```
$ sum
0

$ sum 1 2 3
6

$ sum a
Invalid: number
sum a
    ^
```

## Soup

The soup command illustrates a single configuration variable that can be true
or false depending on which of several flags are given.
Each flag has its own corresponding value, indicated by its `=` expression,
and one of them may be a default, indicated with the asterisk.

Additionally, the configuration value has a specified `:boolean` type,
necessary to convert the flag values as strings to their corresponding boolean
value.

```js
var Command = require('shon/command');
var command = new Command('soup', {
    soup: '[--soup=true*|-s=true|--no-soup=false|-S=false] :boolean ' +
        'Whether to serve soup'
});

var config = command.exec(process.argv, 2);

if (config.soup) {
    console.log('Have soup');
} else {
    console.log('No soup for you');
}
```

```
$ serve
Have soup

$ serve --no-soup
No soup for you
```

It is unnecessary to specify the `:boolean` for flags that take no argument and
do not specify their values: they are presumed to all set the config value to
true.

## Help Trumps All

Idioms like ``[-h|--help]*`` and ``[-v|--version]*`` are special because they
invalidate all other required arguments.
The asterisk denotes "trump flags".
If the parser encounters one of these trump flags, it will bypass all further
validation and simply return the name of the config variable instead of the
config object.

This helpful command has a required argument, but if you provide `--help` on
the command line, the parser overlooks the missing argument and returns "help"
so you can provide an alternate behavior.

```js
var command = new Command('do', {
    activity: '<activity>',
    help: '[-h|--help]*'
});

var config = command.exec();

if (config === 'help') {
    command._logUsage();
    return;
}

console.log('doing activity:', config.activity);
```

## Subcommands

Commands can have subcommands.
The selected command gets captured as a `{name, config}` object.

```js
'use strict';

var Command = require('..');

var command = new Command('db\n' +
    'A simple key-value store', {
    action: {
        get: {
            key: '<key>'
        },
        set: {
            key: '<key>',
            value: '<value>'
        },
        rm: {
            key: '<key>',
            force: '[-f|--force]'
        },
        ls: {
        }
    }
});

var config = command.exec();
var subconfig = config.action.config;

var store = {a: 10, b: 20, c: 30};

switch (config.action.name) {
    case 'ls':
        console.log(Object.keys(store));
        break;
    case 'get':
        console.log(store[subconfig.key]);
        break;
    case 'set':
        store[subconfig.key] = subconfig.value;
        break;
    case 'rm':
        delete store[subconfig.key];
        break;
}
```

```
$ db ls
[ 'a', 'b', 'c' ]
$ db set a 10
$ db get a
10
$ db rm a
```

## Precompiled Usage

The Command object provides a thin veneer, easily bypassed.
You can precompile a command description or "usage file" to JSON and use that
JSON blob directly.
The following is a `troll.usage` file.

```
usage: troll <name> <color> <airspeed>
Answer me these questions three, ere the other side ye see.

name: [-n|--name] <name>
    What is your name?
color: [-c|--color] <color>
    What is your favorite color?
airspeed: [-a|--airpseed] <airspeed> :number
    What is the average airspeed velocity of an unladen swallow?
help: [-h|--help]*
```

Shon provides a command line tool called `usage2json` that converts files in
this format to a JSON blob.

```
usage2json troll.usage > troll.json
```

You can use the generated JSON directly.
This bypasses the usage parser entirely.

```js
'use strict';

var exec = require('../exec');
var logUsage = require('../log-usage');
var command = require('./troll.json')
var config = exec(command);

if (config === 'help') {
    return logUsage(command);
}

console.log('Name:', config.name);
console.log('Color:', config.color);
console.log('Airpseed:', config.airspeed);
```

This does, however, somewhat compromise the extensibility of the command
description since the JSON blob does not index terms both by their position and
name.

## Usage Grammar

The [grammar](usage.pegs) for parsing usage has the following semantics:

Each term may have some combination of flags and an argument.
Flags and arguments combine in various ways:

-   `[-f|--flag]`
    An optional flag.
    Each flag may specify a value, like `-a=alpha|-b=beta`.
    If none of the flags specify a value, the variable will be a boolean,
    false by default, and switched to true by the presence of any of the flags.
-   `[-f|--flag] <argument>`
    A required argument, optionally specified with a flag.
    So, if a command accepts multiple arguments, they will be taken from the
    command line in order, but can be specified in any order using flags.
-   `[-f|--flag <argument>]`
    An optional flag with an argument.
    The argument can only be specified with the flag.
- `-f|--flag <argument>`
    A required flag with an argument.
    The argument can only be specified with the flag.
- `<argument>`
    A required argument.
    The argument must appear in the declared order on the command line.

Future versions of this library intend to add support for other idioms,
including the `-v/-q` idiom for upgrading or downgrading verbosity.

By default, an argument will set a single configuration value.
However, with a collector annotation, each argument may append a value onto an array.

-   `<argument>...`
    An argument that may be specified any number of times.
    The configuration value will be an array, empty by default.
-   `<argument>{count}`
    The argument must be specified exactly `count` times.
-   `<argument>{min..}`
    The argument must be specified at least `min` times.
-   `<argument>{min..max}`
    The argument must be specified at least `min` times and no more than `max` times.

Each term may be followed by a type annotation.

-   `:boolean` means that the argument must either be the string `true` or the
    string `false`, with the corresponding boolean values.
-   `:number` means that the argument must represent a number, not NaN.
-   `:quantity` means that the argument must represent a positive integer.
-   `:shon` means that the value of the argument must be expressed with SHON
    (shell object notation), described hereafter.
-   `:jshon` means that the value of the argument must be expressed with JSON
    or SHON with JSON possibly embedded in place of values.
-   `:json` means that the value of the argument must be expressed with JSON.
-   `:input` produces a readable stream from a file name, or `-` for standard
    input.
    Standard input is implied if the argument is optional and the argument is
    omitted.
-   `:atinput` produces a readable stream, from the literal argument, or from a
    file name if prefixed with `@`, or standard input if `@-`.
-   `:output` produces a writable stream from a file name, or `-` for standard
    output.
    Standard output is implied if the argument is optional and omitted.

Future versions of this library will introduce further type annotations for
reading and writing by file name or `-`.

## Usage Model

The command usage model is designed with the intent that other libraries will
provide a higher level interface that produce it (like a tool that
automatically abbreviates and creates negative flags), and other utilities that
will consume it (like a tool that provides shell completion).

The `Command` constructor generates a command model object, suitable for
passing to `exec`, `parse`, or `usage` functions, or a variety of other
possible uses.
These functions require an object with the following shape:

-   ``_name`` the name of the command.
-   ``_terms`` is an array of terms.
    Each term corresponds to a configuration variable and describes all of the
    argument forms necessary to populate it.

The `Command` constructor also reveals each term by its name to make it easier
to programmatically manipulate each term after the skeleton has been generated.

Each term has the following shape:

-   `name` the name of the corresponding configuration variable.
-   `flags` an array of flags.
-   `arg` the name of the term's argument or `null` if it does not accept one.
-   `commands` an object mapping subcommand names to command shapes, or `null`
    if not applicable.
-   `collectorType` is `array` for arrays of any size or `null` if the term
    collects a single value.
    A future version may introduce a `difference` collector for upgrading or
    downgrading a value.
-   `type` is an arbitrary type name which may have custom parsers, converters,
    validators, or collectors associated.
    SHON provides behaviors for `boolean`, `number`, `quantity`, `json`,
    `shon`, and `jshon`.
-   `parser` is an optional parser constructor.
-   `converter` is an optional converter object or function.
-   `validator` is an optional validator object or function.
-   `collector` is an optional collector object or function.
-   `required` implies that this term must be specified on the command line.
-   `optionalFlag` implies that this term's argument can be specified either in
    order or earlier if specified with its flag.
-   `minLength` if the term is an array, the minimum length, albeit 0
-   `maxLength` if the term is an array, the maximum length, albeit Infinity

A flag has the following shape:

-   `flag` is the full text of the flag including the `-` or `--` prefix.
-   `long` is `true` if the prefix is `--`
-   `short` is `true` if the prefix is `-`
-   `value` is the string representation of the value that this flag will set.
    It will be converted and validated based on the term's type.
-   `default` is `true` if the flag produces the default value.

## Converters

Converter objects implement a `convert` method. Converter functions accept a
string from the command line and return the corresponding JavaScript value.
They also receive an `iterator` and `delegate` object which can be used
to report errors and halt the parser.

```js
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
```

## Validators

Validator objects implement a `validate` method. Validate functions accept a
value and return whether it is valid.

...

## Collectors

...

## Parsers

...

## Iterators

...

## Cursors

...

## Delegates

...

## SHON (SHell Object Notation)

SHON is an idiomatic notation for expressing objects at the command line.
All of JSON can be expressed with SHON.
SHON lends itself better to command line usage for the purposes of
interpolating variables and tab completion.
Any parser can accept SHON with the `:shon` type annotation.

Type          | JSON                 | SHON
------------- | -------------------- | ---------------------
Object        | `{"hello": "World"}` | `[ --hello World ]`
Array         | `["beep", "boop"]`   | `[ beep boop ]`
Array         | `[1, 2, 3]`          | `[ 1 2 3 ]`
Empty Array   | `[]`                 | `[ ]` or `[]`
Object        | `{"a": 10, b: 20}`   | `[ --a 10 --b 20 ]`
Empty Object  | `{}`                 | `[--]`
Number        | `1`                  | `1`
Number        | `-1`                 | `-1`
Number        | `1e3`                | `1e3`
String        | `"hello"`            | `hello`
String        | `"hello world"`      | `'hello world'`
String        | `"10"`               | `-- 10`
String        | `"-10"`              | `-- -10`
String        | `"-"`                | `-- -`
String        | `"--"`               | `-- --`
True          | `true`               | `-t`
False         | `false`              | `-f`
Null          | `null`               | `-n`

SHON subexpressions can be interpolated with a bare `$SHON` variable.
The proper idiom for interpolating an arbitrary string in SHON is `--
"$VARIABLE"`.
This ensures that the variable is interpreted as a string literal in place.

This package ships with a `shon` command for converting SHON to JSON at the
command line.

## Acknowledgements

This project is based on earlier work implemented for [NarwhalJS][] by Kris
Kowal, Tom Robinson, and Abhinav Gupta.
Abhinav is responsible for having contrived the brilliant name, SHON.

[NarwhalJS]: https://github.com/280north/narwhal

---

Copyright (c) 2009-2015 Contributors
MIT License
