class StoreError extends Error{
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class ActionValidationError extends StoreError{
    constructor(message, action) {
        super(message);
        this.causedByAction = action;
    }
}

export {ActionValidationError};
