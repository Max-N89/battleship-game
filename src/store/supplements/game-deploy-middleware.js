import {gameDeploy, gameError} from "../slices/game";
import {selectPlayerDeploymentMap} from "../selectors";
import validateGameDeploy from "./validate-game-deploy";
import {GameError} from "../../custom-errors";

const gameDeployMiddleware = store => next => action => {
    if (action.type === `${gameDeploy}`) {
        // action validation
        const state = store.getState();
        const deploymentMap = selectPlayerDeploymentMap(
            state,
            action.payload.playerId
        );

        try {
            validateGameDeploy(action, deploymentMap);
        } catch (e) {
            if (!(e instanceof GameError)) {
                throw e;
            }

            return store.dispatch(gameError(e));
        }
    }

    return next(action);
};

export default gameDeployMiddleware;
