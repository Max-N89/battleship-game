import {gameDeploy, gameError} from "../slices/game";
import {selectPlayerDeploymentGridMap, selectSettingsShips} from "../game-selectors";
import validateGameDeploy from "./validate-game-deploy";
import {GameError} from "../../custom-errors";

const gameDeployMiddleware = store => next => action => {
    if (action.type === `${gameDeploy}`) {
        // action validation
        const state = store.getState();
        const deploymentGridMap = selectPlayerDeploymentGridMap(state, action.payload.playerId);
        const settingsShips = selectSettingsShips(state);

        try {
            validateGameDeploy(action, deploymentGridMap, settingsShips);
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
