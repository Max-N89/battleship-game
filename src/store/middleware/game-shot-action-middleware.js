import {ActionValidationError} from "../supplements/store-errors";
import {gameShoot, gameError} from "../slices/game";
import {selectGameGridDescription, selectPlayerShotsHistory} from "../selectors";
import validateGameShotAction from "../supplements/validate-game-shot-action";

const gameShotActionMiddleware = store => next => action => {
    if (action.type === `${gameShoot}`) {
        // action validation
        const state = store.getState();
        const shotsHistory = selectPlayerShotsHistory(state, action.payload.playerId);
        const gridDescription = selectGameGridDescription(state);

        try {
            validateGameShotAction(action, shotsHistory, gridDescription);
        } catch (e) {
            if (!(e instanceof ActionValidationError)) {
                throw e;
            }

            const {message, cause} = e;

            return store.dispatch(gameError(message, cause));
        }
    }

    return next(action);
};

export default gameShotActionMiddleware;
