'use strict';

var Command = require('../command');
var Delegate = require('./delegate');

function commandCases(setup, cases) {
    return function t(assert) {
        var command = new Command('dwim');
        setup(command);

        for (var index = 0; index < cases.length; index++) {
            var c = cases[index];
            var delegate = new Delegate(assert, c.logs || {});
            var config = command.parse(c.args, 0, delegate);
            assert.deepEquals(config, c.config, c.name);
            delegate.end();
        }

        assert.end();
    };
}

module.exports = commandCases;
