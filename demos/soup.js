'use strict';

var Command = require('..');

var command = new Command('soup', {
    soup: '[--soup=true*|-s=true|--no-soup=false|-S=false] :boolean Whether to serve soup'
});

var config = command.exec(process.argv, 2);

if (config.soup) {
    console.log('Have soup');
} else {
    console.log('No soup for you');
}
