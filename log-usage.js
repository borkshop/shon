'use strict';

var Delegate = require('./delegate');

function logUsage(command, delegate) {
    delegate = delegate || new Delegate();
    var name = command._name || command.name;
    var usage = command._usage || command.usage;
    delegate.log('usage: ' + name);
    for (var index = 0; index < usage.length; index++) {
        delegate.log('  ' + usage[index]);
    }
}

module.exports = logUsage;
