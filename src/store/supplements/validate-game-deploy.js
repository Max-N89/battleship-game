import {DEPLOYMENT_DIRECTIONS} from "../../constants";
import {GameError} from "../../custom-errors";

const {DEFAULT_MESSAGES: DEFAULT_ERROR_MESSAGES} = GameError;

function validateGameDeploy(action, deploymentMap, settingsShips) {
    const {
        anchorCoords: {
            x: anchorXCoord,
            y: anchorYCoord,
        },
        direction: deploymentDirection,
        shipId,
    } = action.payload.deploymentDescription;

    const shipLength = settingsShips[shipId].length

    const {lastXCoord, lastYCoord} = deploymentMap;

    const isDeploymentHorizontal = deploymentDirection === DEPLOYMENT_DIRECTIONS.HORIZONTAL;
    const isDeploymentVertical = deploymentDirection === DEPLOYMENT_DIRECTIONS.VERTICAL;

    let errorMessage;

    const errorCause = {
        action,
        deploymentMap,
    };

    // check for anchor coordinates are in range between (0, 0) and (lastXCoord, lastYCoord)
    {
        if (anchorXCoord < 0 || anchorXCoord > lastXCoord || anchorYCoord < 0 || anchorYCoord > lastYCoord) {
            errorMessage = DEFAULT_ERROR_MESSAGES.DEPLOYMENT.IS_OUTSIDE;

            throw new GameError(errorMessage, errorCause);
        }
    }

    // check if a ship is fitting into a grid
    {
        if (
            isDeploymentHorizontal &&
            anchorXCoord + shipLength - 1 > lastXCoord ||
            isDeploymentVertical &&
            anchorYCoord + shipLength - 1 > lastYCoord
        ) {
            errorMessage = DEFAULT_ERROR_MESSAGES.DEPLOYMENT.DOES_N0T_FIT;

            throw new GameError(errorMessage, errorCause);
        }
    }

    // check for undeployable cells
    {
        switch (deploymentDirection) {
            case (DEPLOYMENT_DIRECTIONS.HORIZONTAL): {
                for (let xCoord = anchorXCoord; xCoord <= anchorXCoord + shipLength - 1; xCoord++) {
                    if (deploymentMap[anchorYCoord][xCoord].isUndeployable) {
                        errorMessage = DEFAULT_ERROR_MESSAGES.DEPLOYMENT.IS_BLOCKED;

                        throw new GameError(errorMessage, errorCause);
                    }
                }

                break;
            }
            case (DEPLOYMENT_DIRECTIONS.VERTICAL): {
                for (let yCoord = anchorYCoord; yCoord <= anchorYCoord + shipLength - 1; yCoord++) {
                    if (deploymentMap[yCoord][anchorXCoord].isUndeployable) {
                        errorMessage = DEFAULT_ERROR_MESSAGES.DEPLOYMENT.IS_BLOCKED;

                        throw new GameError(errorMessage, errorCause);
                    }
                }

                break;
            }
        }
    }
}

export default validateGameDeploy;
