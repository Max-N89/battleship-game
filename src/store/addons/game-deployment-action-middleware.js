import {STORE_ACTIONS_TYPES} from "../constants";
import {selectGameGridDescription, selectPlayerDeploymentHistory} from "../selectors";
import validateGameDeploymentAction from "../features/validate-game-deployment-action";

const gameDeploymentActionMiddleware = store => next => action => {
    if (action.type === STORE_ACTIONS_TYPES.GAME_DEPLOY) {
        const state = store.getState();
        const deploymentHistory = selectPlayerDeploymentHistory(state, action.payload.playerId);
        const gridDescription = selectGameGridDescription(state);

        if (deploymentHistory && gridDescription) {
            validateGameDeploymentAction(action.payload, deploymentHistory, gridDescription);
        }
    }

    return next(action);
};

export default gameDeploymentActionMiddleware;
