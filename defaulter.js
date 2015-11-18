'use strict';

function Defaulter(def) {
    this.default = def;
}

Defaulter.lift = function lift(def, term) {
    if (!def) {
        return;
    }
    if (def.default) {
        return def;
    }
    if (def.prototype && def.prototype.default) {
        return new def(term);
    }
    return new Defaulter(def);
};

Defaulter.prototype.default = function def(value) {
    return value;
};

module.exports = Defaulter;
