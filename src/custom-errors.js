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

    static MESSAGES = {
        DEPLOYMENT: {
            IS_OUTSIDE: "Deployment anchor is out of game grid.",
            DOES_N0T_FIT: "Ship doesn't fit into game grid.",
            IS_BLOCKED: "Ship is blocked by previous single or multiple deployments.",
        },
        SHOT: {
            IS_OUTSIDE: "Shot coordinates are out of game grid.",
            IS_SAME: "There is a shot with the same coordinates.",
        }
    };
}

export {GameError};
