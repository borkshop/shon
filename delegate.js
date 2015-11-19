'use strict';

function Delegate(args) {
    args = args || {};
    this.exitCode = 0;
    this.trumped = null;
    this._cursor = args.cursor;
    this.logUsage = args.logUsage;
    this.command = args.command;
    this.loggedUsage = false;
}

Delegate.prototype.isDone = function isDone() {
    return this.exitCode !== 0 || this.trumped !== null;
};

Delegate.prototype.log = function log(message, cursor) {
    console.log(message);
};

Delegate.prototype.error = function error(message) {
    if (this.logUsage && !this.loggedUsage) {
        this.logUsage(this.command, this);
        this.loggedUsage = true;
    }
    console.error('\n' + message);
    this.exitCode = 1;
};

Delegate.prototype.warn = function warn(message) {
    console.warn(message);
};

Delegate.prototype.cursor = function markCursor(cursor, offset) {
    // New usage allows the cursor to be provided to the delegate constructor.
    if (this._cursor && offset === undefined) {
        offset = cursor;
        cursor = this._cursor;
    }

    var cursorIndex = cursor.index + (offset || 0);
    var line = '';
    var length = 0;
    for (var index = 0; index < cursor.args.length; index++) {
        if (index === cursorIndex) {
            length = line.length;
        }
        line += cursor.args[index];
        if (index !== cursor.args.length - 1) {
            line += ' ';
        }
    }
    if (index === cursorIndex) {
        length = line.length;
    }
    console.log(line);
    line = '    ';
    while (line.length < length) {
        line = line + line;
    }
    console.log(line.slice(0, length) + '^');
};

Delegate.prototype.end = function end() {
    process.exit(this.exitCode);
};

module.exports = Delegate;
