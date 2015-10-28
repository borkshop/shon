'use strict';

function Delegate() {
    this.exitCode = 0;
}

Delegate.prototype.log = function log(message, cursor) {
    console.log(message);
};

Delegate.prototype.error = function error(message) {
    console.error(message);
    this.exitCode = 1;
};

Delegate.prototype.warn = function warn(message) {
    console.warn(message);
};

Delegate.prototype.cursor = function markCursor(cursor, offset) {
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
