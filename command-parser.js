'use strict';

function CommandParser(commands, collector) {
    this.commands = commands;
    this.collector = collector;
}

CommandParser.prototype.parse = function parse(iterator, delegate) {
    if (iterator.hasArgument()) {
        var command = iterator.shiftArgument();

        if (!(command in this.commands)) {
            delegate.error('Unknown command: ' + command);
            delegate.cursor(iterator.cursor, -1);
            return false;
        }

        var config = this.commands[command]._parse(iterator, delegate);

        if (config === null) {
            return false;
        }

        return this.collector.collect({
            name: command,
            config: config
        });

    } else {
        delegate.error('Expected a command');
        delegate.cursor(iterator.cursor);
        // TODO one of
        return false;
    }
};

module.exports = CommandParser;
