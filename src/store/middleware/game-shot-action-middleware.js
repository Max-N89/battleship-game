import {STORE_ACTIONS_TYPES} from "../constants";
import {selectGameGridDescription, selectPlayerShotsHistory} from "../selectors";
import validateGameShotAction from "../features/validate-game-shot-action";

const gameShotActionMiddleware = store => next => action => {
    if (action.type === STORE_ACTIONS_TYPES.GAME_SHOOT) {
        // action validation
        if (!action.error) {
            const state = store.getState();
            const shotsHistory = selectPlayerShotsHistory(state, action.payload.playerId);
            const gridDescription = selectGameGridDescription(state);

            try {
                validateGameShotAction(action, shotsHistory, gridDescription);
            } catch (e) {
                return next({
                    type: action.type,
                    error: true,
                    payload: e,
                });
            }
        }
    }

    return next(action);
};

export default gameShotActionMiddleware;
