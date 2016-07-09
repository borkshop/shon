
# shon

Shon is a JavaScript command-line argument parser.
Fully describe your command's interface using familiar usage notation.
Since the declarations are complete, Shon can provide informative errors for
all missing or invalid configuration values.
Shon supports both optional and required flags and arguments, as well as
subcommands.

Shon also supports a recursive descent parser for Shell Object Notation (SHON),
so complex objects can be expressed as command line arguments.

Install shon with npm, for both the usage to JSON translator and the
lightweight argument parser.

```
$ npm install --save shon
```

The following is a `.usage` file.

```usage
offer

name: <name>                            A required argument that populates the
                                        `name` config property.
age: <age> :number                      A required argument that populates the
                                        `age` config property with a number.
resume: <filename> :input               A required file name or "-" for standard
                                        input that populates the `resume` config
                                        property with a readable stream.
offer: [<filename>] :output             An optional file name or "-" for standard
                                        output that populates the `offer` config
                                        property with a writable stream.
                                        Defaults to standard output.
nick: [<nickname>]                      An optional argument that populates the
                                        `nick` config property.
active: [-a]                            A boolean flag, defaults the active config
                                        variable to false, true if -a is present
                                        among arguments.
enabled: [-e|--enabled]                 A boolean flag, accepted as either a long
                                        or short flag.
salary: [-s|--salary <salary>] :number  An optional flag with an argument,
                                        defaults the `salary` config variable to
                                        null, or a number if defined.
                                        The salary argument must be a valid number.
prefers: [-S=salary*|-E=equity]         An optional flag that sets the `prefers`
                                        config property to either "salary" or
                                        "equity", and defualts to "salary".
available: -a=true|-A=false :boolean    A required flag, either little or big A,
                                        parsed as boolean.
description: [-d <description>] :atinput An optional description, either as text
                                        in the argument, or in a file if the
                                        filename is prefixed with @ like
                                        @desc.txt
prize: [-p <place>] :quantity           An optional prize place, a number that
                                        must be 1 or more.
misc: [-m <misc>] :json                 Unstructured data expressed as JSON
                                        on the command line.  Must parse properly.
config: [-c <config>] :shon             A configuration expression in JSON or SHON,
                                        which looks like [ --key value ] and can
                                        express nested objects and arrays.
```

The `usage2shon` utility converts usage files
to a JSON description of the command.
You can set up building usage in your `pakcage.json` then just run `npm run
usage` to build a new usage JSON.

```json
{
    "scripts": {
        "usage": "usage2shon offer.usage > offer.json
    }
}
```

The `shon/exec` module accepts the JSON description and produces a
configuration object, or reports errors to the console and returns `null`.

```js
'use strict';
var shon = require('shon/exec');
var usage = requir('./offer.json');
function main() {
    var config = shon(usage);
    if (config == null) {
        return;
    }
    console.log('active:', config.active);
    console.log('enabled:', config.enabled);
}
```

## Subcommands

...

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
