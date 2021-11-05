class StoreError extends Error{
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class ActionValidationError extends StoreError{
    constructor(message, cause) {
        super(message);
        this.cause = cause;
    }
}

export {ActionValidationError};
