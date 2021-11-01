class StoreError extends Error{
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class ActionValidationError extends StoreError{
    constructor(message, description) {
        super(message);
        this.actionPayload = description?.actionPayload;
    }
}

class GameActionValidationError extends ActionValidationError{
    constructor(message, description) {
        super(message, description);
        this.gameSettings = {
            grid: description?.gridDescription,
            ships: description?.shipsDescription,
        };
        this.playerId = description?.actionPayload?.playerId;
    }
}

class DeploymentActionValidationError extends GameActionValidationError{
    constructor(message, description) {
        super(message, description);
        this.playerDeploymentHistory = description?.deploymentHistory;
    }
}

class ShotActionValidationError extends GameActionValidationError{
    constructor(message, description) {
        super(message, description);
        this.playerShotsHistory = description?.shotsHistory;
    }
}

export {DeploymentActionValidationError, ShotActionValidationError};
