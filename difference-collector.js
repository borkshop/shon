'use strict';

function DifferenceCollector(name, value) {
    this.value = value;
}

DifferenceCollector.prototype.collect = function collect(value) {
    this.value += value;
};

DifferenceCollector.prototype.capture = function capture() {
    return this.value;
};

module.exports = DifferenceCollector;
