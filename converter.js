'use strict';

function Converter() {
    this.convert = this.convert;
}

Converter.lift = function lift(convert) {
    if (convert.convert) {
        return convert;
    }
    var converter = new Converter();
    converter.convert = convert || converter.convert;
    return converter;
};

Converter.prototype.convert = function convert(value, delegate) {
    return value;
};

module.exports = Converter;
