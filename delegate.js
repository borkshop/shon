'use strict';

function Delegate() {
    this.exitCode = 0;
}

Delegate.prototype.log = function log(message, cursor) {
    console.log(message);
};

Delegate.prototype.error = function error(message, cursor) {
    console.error(message);
    if (cursor) {
        this.cursor(cursor);
    }
    this.exitCode = 1;
};

Delegate.prototype.warn = function warn(message, cursor) {
    console.warn(message);
    if (cursor) {
        this.cursor(cursor);
    }
};

Delegate.prototype.cursor = function markCursor(cursor) {
    var line = '';
    var length = 0;
    for (var index = 0; index < cursor.args.length; index++) {
        if (index === cursor.index) {
            length = line.length;
        }
        line += cursor.args[index];
        if (index !== cursor.args.length - 1) {
            line += ' ';
        }
    }
    if (index === cursor.index) {
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
};

module.exports = Delegate;
