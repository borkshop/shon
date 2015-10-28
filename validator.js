'use strict';

function Validator() {
    this.validate = this.validate;
}

Validator.lift = function lift(validate) {
    if (validate && validate.validate) {
        return validate;
    }
    var validator = new Validator();
    validator.validate = validate || validator.validate;
    return validator;
};

Validator.prototype.validate = function validate(value, delegate) {
    return true;
};

module.exports = Validator;
