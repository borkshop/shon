
# argz

Argz is a JavaScript command-line argument parser.
Fully describe your command's interface using familiar usage notation.
Since the declarations are complete, Argz can provide informative errors for
all missing or invalid configuration values.
Argz supports both optional and required flags and arguments, as well as
subcommands.


## Installation

```
$ npm install --save argz
```

## Common Boolean Flags

A boolean flag is an option that switches a config value from false to true.

```js
var Command = require('argz');
var command = new Command('dwim', {
    bool: '-b|--bool A boolean flag'
});

var config = command.exec(process.argv, 2);
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
```

## Troll

The Bridge Troll accepts three required arguments as flags.
The last argument is a number, so the `:quantity` type annotation ensures that
the value on the command line is converted to a number and is a valid, positive
number. The `:number` annotation merely validates that the value is a number.

```js
var command = new Command('troll ' +
    'Answer me these questions three, ere the other side ye see.', {
    name: '-n|--name <name> What is your name?',
    color: '-c|--color <color> What is your favorite colour?',
    airspeed: '-a|--airspeed <airspeed> :quantity What is the average ' +
        'airspeed velocity of an unladen swallow?'
});

var config = command.exec();

console.log('Name:', config.name);
console.log('Color:', config.color);
console.log('Airpseed:', config.airspeed);
```

## Cut

The cut command accepts two optional arguments with custom default values, a
custom converter, and a custom validator.

```js
'use strict';

var Command = require('argz');

var command = new Command('cut', {
    delim: '[-d <delim>]',
    fields: '[-f <fields>]'
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

process.stdin.setEncoding('utf8');
process.stdin.on('data', function (line) {
    var parts = line.trim().split(config.delim);
    console.log(config.fields.map(function get(field) {
        return parts[field - 1];
    }).join(config.delim));
});
```

## Sum

The sum command accepts any number of arguments and computes their sum.

```js
var Command = require('argz');
var command = new Command('sum Computes the sum of multiple numbers', {
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
var Command = require('argz');
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

## Subcommands

Commands can have subcommands.
The selected command gets captured as a `{name, config}` object.

```js
'use strict';

var Command = require('..');

var command = new Command('db A simple key-value store', {
    command: {
        get: {
            key: '<key>'
        },
        set: {
            key: '<key>',
            value: '<value>'
        },
        rm: {
            key: '<key>',
        },
        ls: {
        }
    }
});

var config = command.exec();
var subconfig = config.command.config;

var store = {a: 10, b: 20, c: 30};

switch (config.command.name) {
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

---

Copyright (c) 2009-2015 Contributors
MIT License
