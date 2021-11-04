import {STORE_ACTIONS_TYPES} from "../constants";
import {selectPlayerDeploymentMap} from "../selectors";
import validateGameDeploymentAction from "../features/validate-game-deployment-action";

const gameDeploymentActionMiddleware = store => next => action => {
    if (action.type === STORE_ACTIONS_TYPES.GAME_DEPLOY) {
        const deploymentMap = selectPlayerDeploymentMap(
            store.getState(),
            action.payload.playerId
        );

        try {
            validateGameDeploymentAction(action, deploymentMap);
        } catch (e) {
            console.log(e);
            return next({
                type: "game/error",
            });
        }
    }

    return next(action);
};

export default gameDeploymentActionMiddleware;
