
# argz

Argz is a JavaScript command-line argument parser.
Argz supports UNIX conventions including `-k<value>` flags or `-xvf <file>`
style flags, `--key value` flags, `--key=value` flags, and `--` escaped
arguments.

Fully describe your command's interface with `Command` objects, using
`argument` for required arguments, `option` for optional arguments, and
`command` for subcommands.
Options and arguments can be either positional or flagged.
Flags can be customized with alternate parsers, converters, validators, and
collectors.

With this grammar, you can both parse your command-line arguments to produce a
configuration object and generate usage help.
Because the grammar describes the interface of the command completely, the
parser can recognize all valid combinations of arguments and produce
informative errors for invalid arguments.

## Installation

```
$ npm install --save argz
```

## Boolean Flags

A boolean flag is an option that switches a config value from false to true.

```js
var Command = require('argz');
var command = new Command('dwim');
command.option('-b', '--bool', 'A boolean flag');

var config = command.parse(process.argv, 2);
if (config === null) return;
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

You can give the boolean flag a name without specifying a long `--bool` option.

```js
var Command = require('argz');
var command = new Command('dwim');
command.option('bool', '-b', 'A boolean flag');

var config = command.parse(process.argv, 2);
if (config === null) return;
// config.bool
```

## No- Flags

A negative boolean flag switches a value from true to false.

```js
var Command = require('argz');
var command = new Command('serve');
command.option('--no-soup', 'Disable soup provision')

var config = command.parse(process.argv, 2);
if (config === null) return;
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

## Optional value

```js
var Command = require('argz');
var command = new Command('troll')
command.option('-c', '--color', '<color>', 'What is your favorite color?');
var config = command.parse(process.argv, 2);
if (config === null) return;
console.log('Color:', config.color);
```

```
$ troll
Color: null

$ troll --color blue
Color: blue

$ troll --color=yellow
Color: yellow
```

You can provide a default for a key.

```js
command.option('-c', '--color', '<color>')
    .default('green');
```

Normally, sequences of flags unravel like `tar`.

```js
var Command = require('argz');
var command = new Command('troll',
    'Answer me these questions three, ere the other side ye see.');
command.option('-n', '--name', '<name>',
    'What is your name?');
command.option('-c', '--color', '<color>',
    'What is your favorite color?')
command.option('-s', '--airspeed', '<airspeed>',
    'What is the average airspeed velocity of an unladen swallow');
var config = command.parse(process.argv, 2);
if (config === null) return;
console.log('Name:', config.name);
console.log('Color:', config.color);
console.log('Airpseed:', config.airspeed);
```

```
$ troll -ncs Arthur blue 'African or European?'
Name: Arthur
Color: blue
Airspeed: African or European?
```

Your command can also support short argument forms like `cut`

```js
var Command = require('argz');
var command = new Command('cut')
command.option('-d<delim>').help('Delimiter');
command.option('-f<field>').int().help('Field');
var config = command.parse(process.argv, 2);
if (config === null) return;
console.log('Delimiter:', JSON.stringify(config.delim));
console.log('Field:', config.field);
```

```
$ cut -d: -f1
Delimiter: ":"
Field: 1
```

# Converting and validating

Argz can parse, convert, validate, and collect arguments with
certain annotations.
In this shorthand, we use the `int()` and `push()` decorators
to indicate that the values should be converted to numbers,
validated as integers, and pushed onto an array.

```js
var Command = require('argz');
var command = new Command('add')
command.argument('left', '<value>').int();
command.argument('right', '<value>').int();
var config = command.parse(process.argv, 2);
if (config === null) return;
console.log(config.left + config.right);
```

```
$ add 2 2
4

$ add 2 -1
Expected: value
add 2 -1
      ^

$ add 2 boo
Expected: value
add 2 boo
      ^
```

The `convert(converter)` and `validate(validator)` arguments
enable you to provide an arbitrary converter or validator,
for example, the functions `Number` and `isPositive`,
or objects with `convert(value, logger)` or `validate(value, logger)` methods.

## Collecting multiple values

The `push()` method specifies that the values should be collected by pushing
onto an array.
This implies that the argument or option can be specified multiple times and
has a default outcome of an empty array.

```js
var Command = require('argz');
var command = new Command('ping');
command.option('addresses', '-a<address>', '--address').push();
var config = command.parse(process.argv, 2);
console.log(config.addresses);
```

```
$ ping -a localhost:8080 -a localhost:8888
['localhost:8080', 'localhost:8888']
```

Collection is separate from conversion and validation, and works just as well
for arguments and options.

```js
var Command = require('argz');
var command = new Command('sum');
command.option('numbers', '<number>')
    .coerce(Number)
    .validate(isPositive)
    .push();

function isPositive(number) {
    return number > 0;
}

function add(a, b) {
    return a + b;
}

var config = command.parse(process.argv, 2);
console.log(config.numbers.reduce(add, 0));
```

```
$ sum
0

$ sum 1 2 3
6

$ sum a
Expected: number
sum a
    ^
```

## Subcommands

```js
var Command = require('argz');
var store = new Command('db');

var set = store.command('set');
set.argument('<key>');
set.argument('<value>');

var get = store.command('get');
get.argument('<key>');

var rm = store.command('rm');
rm.option('-f', '--force');
```

```
$ db set a 10
$ db get a
10
$ db rm a
```

---

Copyright (c) 2009-2015 Contributors
MIT License
