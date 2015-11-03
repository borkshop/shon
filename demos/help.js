'use strict';

var Command = require('..');

var command = new Command('doit', {
    thing: '<thing>',
    help: '[-h|--help]*'
});

var helpCommand = new Command('man --help', {
    help: '-h|--help',
    topic: '[<topic>]'
});

var config = command.exec();

if (config === 'help') {
    config = helpCommand.exec();
    console.log('helping with', config.topic);
} else {
    console.log('doing', config.thing);
}
