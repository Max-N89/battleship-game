import {gameDeploy, gameError} from "../slices/game";
import {selectPlayerDeploymentMap} from "../selectors";
import validateGameDeploymentAction from "../supplements/validate-game-deployment-action";
import {ActionValidationError} from "../supplements/store-errors";

const gameDeploymentActionMiddleware = store => next => action => {
    if (action.type === `${gameDeploy}`) {
        // action validation
        const state = store.getState();
        const deploymentMap = selectPlayerDeploymentMap(
            state,
            action.payload.playerId
        );

        try {
            validateGameDeploymentAction(action, deploymentMap);
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

export default gameDeploymentActionMiddleware;
