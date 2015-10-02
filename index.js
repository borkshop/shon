
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson
// -- abhinav Abhinav Gupta

var fs = require('fs');
var path = require('path');

function UsageError(message) {
    this.name = 'UsageError';
    this.message = message;
}

UsageError.prototype = Object.create(Error.prototype);

function ConfigurationError(message) {
    this.name = 'ConfigurationError';
    this.message = message;
}

ConfigurationError.prototype = Object.create(Error.prototype);

/**
 * Create a new command line argument schema.
 *
 * @constructor
 */
function Schema() {
    this._options = [];
    this._def = {};
    this._long = {};
    this._short = {};
    this._commands = {};
    this._args = [];
    this._vargs = undefined;
    this._interleaved = false;
}

/**
 * Add an option to the schema.
 *
 * Takes the same arguments as the {@link Option} constructor.
 *
 * @returns {Option} the new Option object
 */
Schema.prototype.option = function () {
    var option = new this.Option(this, arguments);
    this._options.push(option);
    return option;
};

/**
 * Create a new group of options.
 *
 * @param {String} name     name of the group
 * @returns {Group}         {@link Group} object representing the group
 */
Schema.prototype.group = function (name) {
    var group = new this.Group(this, this, name);
    this._options.push(group);
    return group;
};

/**
 * Set default values for the schema.
 *
 * @param {String} name     key in the result
 * @param          value    default value for the key
 * @returns {Schema}        this
 */
Schema.prototype.def = function (name, value) {
    this._def[name] = value;
    return this;
};

/**
 * Reset the default values in the given hash.
 *
 * Normally, this won't be used externally.
 *
 * @param {Object} options  schema state
 */
Schema.prototype.reset = function (options) {
    var self = this;
    for (var name in this._def) {
        if (hasOwnProperty.call(this._def, name) && !hasOwnProperty.call(options, name))
            options[name] = copy(this._def[name]);
    }
    this._options.forEach(function (option) {
        if (!(option instanceof self.Option))
            return;
        if (!hasOwnProperty.call(options, option.getName()))
            options[option.getName()] = option._def;
    });
};

/**
 * Add a new sub-command to the schema.
 *
 * @param {String} name         name of the sub command
 * @param          [handler]    either a module name that exports a `schema'
 *                              or a function that will be used as a schema
 *                              action
 * @returns {Schema}            if no handler was given or a schema action was
 *                              given, returns the Schema for the sub-command
 */
Schema.prototype.command = function (name, handler) {
    var parent = this;
    if (!handler) {
        var schema = new Schema();
        this._commands[name] = function () {
            return schema;
        };
        return schema;
    } else if (typeof handler == 'string') {
        this._commands[name] = function () {
            return require(handler).schema;
        };
        return;
    } else {
        var schema = new this.Schema();
        schema.action(handler);
        this._commands[name] = function () {
            return schema;
        };
        return schema;
    }
};

/**
 * Add a single positional argument to the command.
 *
 * Warning: Only used for printing the help or usage. The schema is not
 * responsible for reading them from the command line arguments.
 *
 * @param {String} name     name of the argument
 * @returns {Argument}      {@link Argument} object reprsenting the argument
 */
Schema.prototype.arg = function (name) {
    var argument = new Argument(this).name(name);
    this._args.push(argument);
    return argument;
};

/**
 * Add a variable number of arguments to the command.
 *
 * Warning: Only used for printing the help or usage. The schema is not
 * responsible for reading them from the command line arguments.
 *
 * @param {String} name     name of the arguments
 * @returns {Argument}      {@link Argument} object representing the argument
 */
Schema.prototype.args = function (name) {
    var argument = new Argument(this).name(name);
    this._vargs = argument;
    return argument;
};

/**
 * Enable or disable interleaved arguments.
 *
 * Disabled by default.
 *
 * @param {Boolean} [value=true]    true to allow interleaved arguments
 * @returns {Schema}                this
 */
Schema.prototype.interleaved = function (value) {
    if (value === undefined)
        value = true;
    this._interleaved = value;
    return this;
};

/**
 * Act on the given arguments.
 *
 * Parses the arguments and calls the appropriate actions.
 *
 * Normally, this won't be used externally.
 *
 * @param {String[]} args       arguments to parse
 * @param {Option[]} options    result of the parent schema
 */
Schema.prototype.act = function (args, options) {
    if (!this._action) {
        this.error(options, 'Not yet implemented.');
        this.exit(-1);
    }
    options.acted = true;
    this._action.call(this, this.parse(args), options);
};

/**
 * Add an action to the schema.
 *
 * If an action already exists, the new action will be executed after the
 * executing action.
 *
 * Warning: Not executed when the parse method is called. Normally used on
 * sub-command schemas only.
 *
 * @param {Function} action     the action to execute
 * @returns {Schema}            this
 */
Schema.prototype.action = function (action) {
    if (this._action) {
        action = (function (previous, next) {
            return function () {
                previous.apply(this, arguments);
                next.apply(this, arguments);
            };
         })(this._action, action);
    }
    this._action = action;
    return this;
};

/**
 * Make the schema helpful.
 *
 * Will add help options and if required, commands.
 *
 * Warning: Must be called last, after all schema configuration is finished.
 *
 * @returns {Schema} this
 */
Schema.prototype.helpful = function () {
    var self = this;
    this.option('-h', '--help')
        .help('displays usage information')
        .action(function (options) {
            return self.printHelp(options);
        })
        .halt();
    if (!isEmpty(this._commands))
        this.command('help', function (options) {
            self.printHelp(options);
        }).help('displays usage information');
    return this;
};

Schema.prototype.usage = function (usage) {
    this._usage = usage;
    return this;
};

Schema.prototype.help = function (help) {
    this._help = help;
    return this;
};

Schema.prototype.printHelp = function (options) {
    var args = options.args || [];
    if (args.length) {
        // parse args for deep help
        // TODO offer extended help for options
        if (!hasOwnProperty.call(this._commands, args[0])) {
            this.error(options, JSON.stringify(args[0]) + ' is not a command.');
            this.printCommands(options);
            this.exit(-1);
        } else {
            args.splice(1, 0, '--help');
            this._commands[args[0]]().act(args, options);
            this.exit(-1);
        }
    } else {
        this.printUsage(options);
        if (this._help)
            this.print(this._help);
        this.printCommands(options);
        this.printOptions(options);
        this.exit(-1);
    }
};

Schema.prototype.printUsage = function (options) {
    this.print(
        'Usage: ' + path.basename(options.command || '<unknown>') +
        (!this._interleaved ?  ' [OPTIONS]' : '' ) +
        (!isEmpty(this._commands) ?
            ' COMMAND' :
            ''
        ) +
        (this._args.length ?
            ' ' + this._args.map(function (arg) {
                if (arg._optional) {
                    return '[' + arg._name.toUpperCase() + ']';
                } else {
                    return arg._name.toUpperCase();
                }
            }).join(' ') :
            ''
        ) +
        (this._vargs ?
            ' [' + this._vargs._name.toUpperCase() + ' ...]':
            ''
        ) +
        (this._interleaved ?  ' [OPTIONS]' : '' ) +
        (this._usage ?
            ' ' + this._usage :
            ''
        ) + ''
    );
};

Schema.prototype.printCommands = function (options) {
    var names = Object.keys(this._commands);
    for (var index = 0; index < names.length; index++) {
        var name = names[index];
        var command = this._commands[name];
        var schema = command();
        this.print('  ' + name + '' + (
            schema._help ?
            (
                ': ' +
                (
                    schema._action?
                    '': 'Not yet implemented: '
                ) +
                schema._help
            ) : ''
        ));
    }
};

Schema.prototype.printOption = function (options, option, depth, parent) {
    var self = this;
    depth = depth || 0;
    var indent = '';
    for (var index = 0; index < depth; index++) {
        index += '    ';
    }

    if (option._hidden)
        return;
    if (option._group !== parent)
        return;

    if (option instanceof Group) {
        self.print(indent + ' ' + option._name + ':');
        var parent = option;
        option._options.forEach(function (option) {
            return self.printOption(options, option, depth + 1, parent);
        });
        return;
    }

    var message = [];
    if (option._short.length)
        message.push(option._short.map(function (_short) {
            return ' -' + _short;
        }).join(''));
    if (option._long.length)
        message.push(option._long.map(function (_long) {
            return ' --' + _long;
        }).join(''));
    if (option._action && option._action.length > 2)
        message.push(
            ' ' +
            range(option._action.length - 2)
            .map(function () {
                return option.getDisplayName().toUpperCase();
            }).join(' ')
        );
    if (option._help)
        message.push(': ' + option._help + '');
    if (option._choices) {
        var choices = option._choices;
        if (choices && typeof choices.length !== 'number') {
            choices = Object.keys(choices);
        }
        message.push(' (' + choices.join(', ') + ')');
    }
    if (option._halt)
        message.push(' (final option)');
    self.print(indent + message.join(''));

};

Schema.prototype.printOptions = function (options) {
    var self = this;
    self._options.forEach(function (option) {
        self.printOption(options, option);
    });
};

Schema.prototype.error = function (options, message) {
    if (this._schema) {
        this._schema.error.apply(
            this._schema,
            arguments
        );
    } else {
        this.print('' + message + '');
        this.exit();
    }
};

Schema.prototype.exit = function (status) {
    if (this._schema) {
        this._schema.exit.apply(
            this._schema,
            arguments
        );
    } else {
        process.exit(typeof status == 'number' ? status : 1);
    }
};

Schema.prototype.print = function () {
    if (this._schema) {
        this._schema.print.apply(
            this._schema,
            arguments
        );
    } else {
        console.log.apply(null, arguments);
    }
};

// verifies that the schema is fully configured
Schema.prototype.check = function () {
    // make sure all options have associated actions
    var self = this;
    self._options.forEach(function (option) {
        if (!(option instanceof self.Option))
            return;
        if (!option._action) {
            throw new ConfigurationError(
                'No action associated with the option'
                // TODO repr(option.getDisplayName())
            );
        }
    });
};

/**
 * Parse the arguments, calling the appropriate option actions.
 *
 * @param {String[]}    [args=process.argv]  command line arguments
 * @param {Object}      [options]            schema state
 * @param {Boolean}     [noCommand=false]    true if sub-commands are not
 *                                           allowed
 * @param {Boolean}     [allowInterleaved]   true to allow interleaved
 *                                           arguments; overrides
 *                                           this.interleaved
 * @returns {Object}                         final schema state
 */
Schema.prototype.parse = function (args, options, noCommand, allowInterleaved) {

    // TODO break this into sub-functions
    // TODO wrap with a try catch and print the progress through the arguments

    var self = this;

    this.check();

    if (!args)
        args = process.argv.slice(1);
    if (!options)
        options = {};
    if (allowInterleaved === undefined)
        allowInterleaved = this._interleaved;

    options.args = args;
    if (!noCommand && args.length && !/^-/.test(args[0]))
        options.command = args.shift();

    function mandatoryShift(n, name) {
        if (n > args.length) {
            this.error(
                options,
                'Error: The ' + JSON.stringify(name) +
                ' option requires ' + n + ' arguments.'
            );
        }
        var result = args.slice(0, n);
        for (var i = 0; i < n; i++)
            args.shift()
        return result;
    };

    function validate(option, value) {
        try {
            if (option._action.length <= 3)
                value = value[0];
            return option._validate.call(self, value);
        } catch (exception) {
            throw exception;
            self.error(options, exception);
        }
    };

    // initial values
    this.reset(options);

    var interleavedArgs = [];

    // walk args
    ARGS: while (args.length) {
        var arg = args.shift();
        if (arg == '--') {
            break;

        } else if (/^--/.test(arg)) {

            var pattern = arg.match(/^--([^=]+)(?:=(.*))?/).slice(1);
            var word = pattern[0];
            var value = pattern[1];

            if (!!value) {
                args.unshift(value);
            }

            if (hasOwnProperty.call(this._long, word)) {

                var option = this._long[word];
                if (!option._action) {
                    self.error(
                        options,
                        'Programmer error: The ' + word +
                        ' option does not have an associated action.'
                    );
                }

                option._action.apply(
                    self,
                    [
                        options,
                        option.getName()
                    ].concat(
                        validate(option, mandatoryShift.call(
                            this,
                            Math.max(0, option._action.length - 2),
                            option.getName()
                        ))
                    )
                );

                if (option._halt)
                    break ARGS;

            } else {
                this.error(options, 'Error: Unrecognized option: ' + JSON.stringify(word));
            }

        } else if (/^-/.test(arg)) {

            var letters = arg.match(/^-(.*)/)[1].split('');
            while (letters.length) {
                var letter = letters.shift();
                if (hasOwnProperty.call(this._short, letter)) {
                    var option = this._short[letter];

                    if (option._action.length > 2) {
                        if (letters.length) {
                            args.unshift(letters.join(''));
                            letters = [];
                        }
                    }

                    option._action.apply(
                        self,
                        [
                            options,
                            option.getName(),
                        ].concat(
                            validate(
                                option,
                                mandatoryShift.call(
                                    this,
                                    Math.max(0, option._action.length - 2),
                                    option.getName()
                                )
                            )
                        )
                    );

                    if (option._halt)
                        break ARGS;

                } else {
                    this.error(options, 'Error: unrecognized option: ' + JSON.stringify(letter));
                }
            }

        } else {
            interleavedArgs.push(arg);
            if (!allowInterleaved)
                break;
        }

    }

    // add the interleaved arguments back in
    args.unshift.apply(args, interleavedArgs)

    if (!isEmpty(this._commands)) {
        if (args.length) {
            if (hasOwnProperty.call(this._commands, args[0])) {
                var command = this._commands[args[0]];
                command().act(args, options);
            } else {
                this.error(options, 'Error: unrecognized command');
            }
        } else {
            this.error(options, 'Error: command required');
            this.exit(0);
        }
    }

    return options;
};

/**
 * Represents positional arguments for the schema.
 *
 * @constructor
 * @param {Schema} schema   the parent schema
 */
function Argument(schema) {
    this._schema = schema;
    return this;
};

/**
 * Set the name of the argument.
 *
 * @param {String} name     name of the schema
 * @returns {Argument}      this
 */
Argument.prototype.name = function (name) {
    this._name = name;
    return this;
};

/**
 * Make the argument optional.
 *
 * @param {Boolean} [value=true]    true to make this optional
 * @returns {Argument}              this
 */
Argument.prototype.optional = function (value) {
    if (value === undefined)
        value = true;
    this._optional = value;
    return this;
};

/**
 * Represents a command line option.
 *
 * Other than the schema, the arguments are read with the following rules.
 *
 * Hashes contain attributes.
 * <code>
 *      new Option(schema, {
 *          action: function () { ... },
 *          _: 'l',         // short name
 *          __: 'list',     // long name
 *          help: 'list all packages'
 *      });
 * </code>
 *
 * A function is the option's action.
 * <code>
 *      new Option(schema, function () { ... });
 * </code>
 *
 * Strings starting with '-' and '--' are short and long names respectivey.
 * <code>
 *      new Option(schema, '-l', '--list');
 * </code>
 *
 * A string with spaces is the help message.
 * <code>
 *      new Option(schema, '-l', '--list', 'list all packages');
 * </code>
 *
 * A one-word string is the display name and the option name. An additional
 * one-word string is the option name.
 * <code>
 *      new Option(schema, '-d', '--delete', 'file', 'del');
 *      // file is the display name and del is the option name
 * </code>
 *
 * @param {Schema} schema       the owning schema
 */
function Option(schema, args) {
    var self = this;
    this._schema = schema;
    this._validate = function (value) {
        return value;
    };
    this._long = [];
    this._short = [];
    for (var index = 0; index < args.length; index++) {
        var arg = args[index];
        if (typeof arg == 'function') {
            self.action(arg);
        } else if (typeof arg !== 'string') {
            for (var name in arg) {
                var value = arg[name];
                self[name](value);
            }
        } else if (/ /.test(arg)) {
            self.help(arg);
        } else if (/^--/.test(arg)) {
            arg = arg.match(/^--(.*)/)[1];
            self.__(arg);
        } else if (/^-.$/.test(arg)) {
            arg = arg.match(/^-(.)/)[1];
            self._(arg);
        } else if (/^-/.test(arg)) {
            throw new Error('option names with one dash can only have one letter.');
        } else {
            if (!self._name) {
                self.name(arg);
                self.displayName(arg);
            } else {
                self.name(arg);
            }
        }
    }
    if (!(self._short.length || self._long.length || self._name))
        throw new ConfigurationError('Option has no name.');
    return this;
};

/**
 * Set the short option.
 *
 * @param {String} letter   the character for the option
 * @returns {Option}        this
 */
Option.prototype._ = function (letter) {
    this._short.push(letter);
    this._schema._short[letter] = this;
    return this;
};

/**
 * Set the long option.
 *
 * @param {String} word     the word for the long option
 * @returns {Option}        this
 */
Option.prototype.__ = function (word) {
    this._long.push(word);
    this._schema._long[word] = this;
    return this;
};

/**
 * Set the name of the option.
 *
 * Used in the result hash.
 *
 * @param {String} name     name of the option
 * @returns {Option}        this
 */
Option.prototype.name = function (name) {
    this._name = name;
    return this;
};

/**
 * Set the display name for the option.
 *
 * Shown in the help as the name of the argument. Useless if the option
 * doesn't have an argument.
 *
 * @param {String} displayName      new display name
 * @returns {Option}                this
 */
Option.prototype.displayName = function (displayName) {
    this._displayName = displayName;
    return this;
};

/**
 * @returns {String} the display name
 */
Option.prototype.getDisplayName = function () {
    if (this._displayName)
        return this._displayName;
    return this.getName();
};

/**
 * @returns {String} the name
 */
Option.prototype.getName = function () {
    if (this._name) {
        return this._name;
    }
    if (this._long.length > 0) {
        return this._long[0];
    }
    if (this._short.length > 0) {
        return this._short[0];
    }
    throw new Error('Programmer error: unnamed option');
};

/**
 * Set the action executed when this option is encountered.
 *
 * @param action        either a function or a string with the name of a
 *                      function in the schema
 * @returns {Option}    this
 */
Option.prototype.action = function (action) {
    var self = this;
    if (typeof action == 'string') {
        this._action = self._schema[action];
    } else {
        this._action = action;
    }
    return this;
};

/**
 * If value is given, the option will not take any arguments and will have the
 * given value if its flag was passed.
 *
 * Otherwise, the option will take a single argument.
 *
 * @param value         desired value
 * @returns {Option}    this
 */
Option.prototype.set = function (value) {
    var option = this;
    if (arguments.length == 0)
        return this.action(function (options, name, value) {
            options[name] = value;
        });
    else if (arguments.length == 1)
        return this.action(function (options, name) {
            options[name] = value;
        });
    else
        throw new UsageError('Option().set takes 0 or 1 arguments');
};

/**
 * The option can have multiple values.
 *
 * Each argument for this option will be passed separately.
 *
 * @returns {Option} this
 */
Option.prototype.push = function () {
    var option = this;
    return this.default([]).action(function (options, name, value) {
        options[name].push(option._validate.call(
            this,
            value
        ));
    });
};

/**
 * The option will keep track of the number of times the flag was passed in the
 * arguments.
 *
 * @returns {Option} this
 */
Option.prototype.inc = function () {
    return this.default(0).action(function (options, name) {
        options[name]++;
    });
};

/**
 * The option's value will be the negative of number of times its flag was
 * passed in the arguments.
 *
 * @returns {Option} this
 */
Option.prototype.dec = function () {
    return this.default(0).action(function (options, name) {
        options[name]--;
    });
};

/**
 * The option can only have one of the given values.
 *
 * @param choices array of string containing the choices or hash whose keys
 *                will be the possible choices and the mapped value will be
 *                the value of the option
 * @returns {Option} this
 */
Option.prototype.choices = function (choices) {
    this.set();
    this._choices = choices;
    var self = this;
    if (typeof choices.length === 'number') {
        return this.validate(function (value) {
            if (choices.indexOf(value) < 0)
                throw new UsageError(
                    'choice for ' + self.getDisplayName().toUpperCase() +
                    ' is invalid: ' + JSON.stringify(value) + '\n' +
                    'Use one of: ' + choices.map(function (choice) {
                        return JSON.stringify(choice);
                    }).join(', ')
                );
            return value;
        })
    } else {
        return this.validate(function (value) {
            if (!hasOwnProperty.call(choices, value))
                throw new UsageError(
                    'choice for ' + self.getDisplayName().toUpperCase() +
                    ' is invalid: ' + JSON.stringify(value) + '\n' +
                    'Use one of: ' + Object.keys(choices).map(function (choice) {
                        return JSON.stringify(choice);
                    }).join(', ')
                );
            return choices[value];
        });
    }
};

/**
 * Set the default value for the option.
 *
 * Overrides setting from Schema.default().
 *
 * @param value      new default value
 * @returns {Option} this
 */
Option.prototype.def = function (value) {
    if (this._def === undefined)
        this._def = value;
    return this;
};

/**
 * Add a validate function to the option.
 *
 * The last added validate function is executed first.
 *
 * @param {Function} validate   the validate function - takes the option's
 *                              value and returns a new value or the original
 *                              value unchanged; can throw {@link UsageError}
 * @returns {Option}            this
 */
Option.prototype.validate = function (validate) {
    var current = this._validate;
    if (this._validate) {
        validate = (function (previous) {
            return function () {
                return current.call(
                    this,
                    previous.apply(this, arguments)
                );
            };
        })(validate);
    }
    this._validate = validate;
    return this;
};

/**
 * The option will take an input file.
 *
 * If the given file name is '-', stdin is used.
 *
 * @returns {Option} this
 */
Option.prototype.input = function () {
    // TODO encoding
    return this.set().validate(function (value) {
        if (value == '-') {
            return process.stdin;
        } else {
            return fs.createReadStream(value);
        }
    });
};

/**
 * The option will take an output file.
 *
 * If the given file name is '-', stdout is used.
 *
 * @returns {Option} this
 */
Option.prototype.output = function () {
    // TODO encoding
    return this.set().validate(function (value) {
        if (value == '-')
            return process.stdout;
        else
            return fs.createWriteStream(value);
    });
};

/**
 * The option will take a number.
 *
 * @returns {Option} this
 */
Option.prototype.number = function () {
    return this.set().validate(function (value) {
        var result = +value;
        if (result !== result) // isNaN
            throw new UsageError('not a number');
        return result;
    });
};

/**
 * The option will take an octal value.
 *
 * @returns {Option} this
 */
Option.prototype.oct = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 8);
        if (result !== result) // isNaN
            throw new UsageError('not an octal value');
        return result;
    });
};

/**
 * The option will take a hexadecimal value.
 *
 * @returns {Option} this
 */
Option.prototype.hex = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 16);
        if (result !== result) // isNaN
            throw new UsageError('not an hex value');
        return result;
    });
};

/**
 * The option will take an integer value.
 *
 * @returns {Option} this
 */
Option.prototype.integer = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 10);
        if (result !== result || result !== +value)
            throw new UsageError('not an integer');
        return result;
    });
};

/**
 * The option will take a natural number
 *
 * @returns {Option} this
 */
Option.prototype.natural = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 0)
            throw new UsageError('not a natural number');
        return result;
    });
};

/**
 * The option will take a whole number.
 *
 * @returns {Option} this
 */
Option.prototype.whole = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 1)
            throw new UsageError('not a whole number');
        return result;
    });
};

/**
 * The option will take a boolean value.
 *
 * @param {Boolean} def     default value
 * @returns {Option}        this
 */
Option.prototype.bool = function (def) {
    if (def === undefined)
        def = true;
    return this.default(!def).set(!!def);
};

Option.prototype.todo = function (command, value) {
    this._schema.default('todo', []);
    command = command || this.getName();
    if (value)
        return this.action(function (options, name, value) {
            options.todo.push([command, value]);
        });
    else
        return this.action(function (options, name) {
            options.todo.push([command]);
        });
};

/**
 * The option will have an inverse option.
 *
 * @returns {Option} this
 */
Option.prototype.inverse = function () {
    var args = arguments;
    if (!args.length) {
        args = [];
        this._short.forEach(function (_) {
            args.push('-' + _.toUpperCase());
        });
        this._long.forEach(function (__) {
            args.push('--no-' + __);
        });
        if (this.getName())
            args.push(this.getName());
    }
    var schema = this._schema;
    var inverse = this._inverse = schema.option.apply(
        schema,
        args
    ).set(!this._def).help('^ inverse');
    return this;
};

/**
 * Set the help text for this option.
 *
 * @param {String} text     the help text
 * @returns {Option}        this
 */
Option.prototype.help = function (text) {
    this._help = text;
    return this;
};

/**
 * The option is final.
 *
 * None of the other options will be parsed after this.
 *
 * @param {Boolean} [value=true]    true to make this option final
 * @returns {Option}                this
 */
Option.prototype.halt = function (value) {
    if (value == undefined)
        value = true;
    this._halt = value;
    return this;
};

/**
 * The option is hidden.
 *
 * It won't be shown in the program usage.
 *
 * @param {Boolean} [value=true]    true to make this option hidden
 * @returns {Option}                this
 */
Option.prototype.hidden = function (value) {
    if (value === undefined)
        value = true;
    this._hidden = value;
    return this;
};

/**
 * Return the option's owning schema.
 *
 * Useful for chaining.
 *
 * @returns {Schema} owning schema
 */
Option.prototype.end = function () {
    return this._schema;
};

/**
 * Helper function equivalent to end().option(...).
 */
Option.prototype.option = function () {
    return this.end().option.apply(this, arguments);
};

/**
 * Return the schema's parent schema.
 *
 * @returns {Schema} parent schema
 */
Schema.prototype.end = function () {
    return this._schema;
};

/**
 * Represents an option group.
 *
 * @param {Schema} schema   option schema
 * @param          parent   parent schema or group
 * @param {String} name     name of the group
 */
function Group(schema, parent, name) {
    this._name = name;
    this._schema = schema;
    this._parent = parent;
    this._options = [];
    return this;
};

/**
 * Add an option to the group.
 *
 * Takes the same arguments as the {@link Option} constructor.
 *
 * @returns {Option} the new Option object
 */
Group.prototype.option = function () {
    var option = this._schema.option.apply(this._schema, arguments);
    option._group = this;
    this._options.push(option);
    return option;
};

/**
 * Create a sub-group to this group.
 *
 * @param {String} name     name of the new group
 * @returns {Group}         the new group
 */
Group.prototype.group = function (name) {
    var Group = this.Group || this._schema.Group;
    var group = new Group(this._schema, this, name);
    return group;
};

/**
 * Returns the group's parent group or schema.
 *
 * Useful for chaining commands.
 *
 * @returns parent schema or group
 */
Group.prototype.end = function () {
    return this._parent;
};

function isEmpty(object) {
    for (var name in object) {
        if (hasOwnProperty.call(object, name)) {
            return false;
        }
    }
    return true;
}

function range(length) {
    var values = [];
    for (var index = 0; index < length; index++) {
        values.push(index);
    }
    return values;
}

function copy(object) {
    var duplicate = {};
    for (var name in object) {
        if (hasOwnProperty.call(object, name)) {
            duplicate[name] = object[name];
        }
    }
    return duplicate;
}

Schema.prototype.Schema = Schema;
Schema.prototype.Option = Option;
Schema.prototype.Group = Group;

module.exports = Schema;
