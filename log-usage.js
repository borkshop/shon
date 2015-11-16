'use strict';

var Delegate = require('./delegate');

function logUsage(command, delegate) {
    delegate = delegate || new Delegate();
    delegate.log('usage: ' + command._name);
    for (var index = 0; index < command._usage.length; index++) {
        delegate.log('  ' + command._usage[index]);
    }
}

module.exports = logUsage;
