import {STORE_ACTIONS_TYPES} from "../constants";
import {selectGameGridDescription, selectPlayerShotsHistory} from "../selectors";
import validateGameShotAction from "../features/validate-game-shot-action";

const gameShotActionMiddleware = store => next => action => {
    if (action.type === STORE_ACTIONS_TYPES.GAME_SHOOT) {
        const state = store.getState();
        const shotsHistory = selectPlayerShotsHistory(state, action.payload.playerId);
        const gridDescription = selectGameGridDescription(state);

        try {
            validateGameShotAction(action, shotsHistory, gridDescription);
        } catch (e) {
            console.log(e);
            return next({
                type: "game/error",
            });
        }
    }

    return next(action);
};

export default gameShotActionMiddleware;
