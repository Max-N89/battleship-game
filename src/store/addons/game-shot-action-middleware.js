import {STORE_ACTIONS_TYPES} from "../../constants";
import {getGameGridDescription, getPlayerShotsHistory} from "../selectors";
import validateGameShotAction from "../features/validate-game-shot-action";

const gameShotActionMiddleware = store => next => action => {
    if (action.type === STORE_ACTIONS_TYPES.GAME_SHOOT) {
        const state = store.getState();
        const shotsHistory = getPlayerShotsHistory(state, action.payload.playerId);
        const gridDescription = getGameGridDescription(state);

        if (shotsHistory && gridDescription) {
            validateGameShotAction(action.payload, shotsHistory, gridDescription);
        }
    }

    return next(action);
};

export default gameShotActionMiddleware;
