import {STORE_ACTIONS_TYPES} from "../../constants";
import {getGameGridDescription, getPlayerDeploymentHistory} from "../selectors";
import validateGameDeploymentAction from "../features/validate-game-deployment-action";

const gameDeploymentActionMiddleware = store => next => action => {
    if (action.type === STORE_ACTIONS_TYPES.GAME_DEPLOY) {
        const state = store.getState();
        const deploymentHistory = getPlayerDeploymentHistory(state, action.payload.playerId);
        const gridDescription = getGameGridDescription(state);

        if (deploymentHistory && gridDescription) {
            validateGameDeploymentAction(action.payload, deploymentHistory, gridDescription);
        }
    }

    return next(action);
};

export default gameDeploymentActionMiddleware;
