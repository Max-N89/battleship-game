import {DEPLOYMENT_DIRECTIONS} from "../constants";
import {ActionValidationError} from "./store-errors";

function validateGameDeploymentAction(action, deploymentMap) {
    const {
        anchorCoords: {
            x: anchorXCoord,
            y: anchorYCoord,
        },
        direction: deploymentDirection,
        length: shipLength,
    } = action.payload.deploymentDescription;

    const lastXCoord = deploymentMap[0].length - 1;
    const lastYCoord = deploymentMap.length - 1;

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
            errorMessage = "Deployment anchor is out of game grid.";

            throw new ActionValidationError(errorMessage, errorCause);
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
            errorMessage = "Ship doesn't fit into game grid.";

            throw new ActionValidationError(errorMessage, errorCause);
        }
    }

    // check for available deployment space
    /* CLARIFICATION: AVAILABLE DEPLOYMENT SPACE
        between each ship, there must be at least one empty cell in any (horizontal, vertical, or diagonal) direction
    */
    {
        // coordinates range to check for occupied cells
        const fromX = anchorXCoord === 0 ? anchorXCoord : anchorXCoord - 1;
        const toX = isDeploymentHorizontal ?
            (anchorXCoord + shipLength > lastXCoord ? anchorXCoord + shipLength - 1 : anchorXCoord + shipLength) :
            (anchorXCoord === lastXCoord ? anchorXCoord : anchorXCoord + 1);

        const fromY = anchorYCoord === 0 ? anchorYCoord : anchorYCoord - 1;
        const toY = isDeploymentVertical ?
            (anchorYCoord + shipLength > lastYCoord ? anchorYCoord + shipLength - 1 : anchorYCoord + shipLength) :
            (anchorYCoord === lastYCoord? anchorYCoord : anchorYCoord + 1);

        for (let y = fromY; y <= toY; y++) {
            for (let x = fromX; x <= toX; x++) {
                if (deploymentMap[y][x].isOccupied) {
                    errorMessage = "Ship is blocked by previous single or multiple deployments.";

                    throw new ActionValidationError(errorMessage, errorCause);
                }
            }
        }
    }
}

export default validateGameDeploymentAction;
