class CustomError extends Error{
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class GameError extends CustomError{
    constructor(message, cause) {
        super(message);
        this.cause = cause;
    }
}

export {GameError};
