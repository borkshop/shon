'use strict';
var Command = require('..');
var command = new Command('sum Computes the sum of multiple numbers', {
    numbers: '<number>... :number'
});
var config = command.exec();
console.log(config.numbers.reduce(function add(a, b) {
    return a + b;
}));
