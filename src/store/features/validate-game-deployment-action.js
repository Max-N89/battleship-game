import {DEPLOYMENT_DIRECTIONS} from "../../constants";
import createDeploymentMap from "./create-deployment-map";
import {DeploymentActionValidationError} from "./store-errors";

function validateGameDeploymentAction(actionPayload, deploymentHistory, gridDescription) {
    const {
        anchorCoords,
        direction: deploymentDirection,
        length: shipLength,
    } = actionPayload;

    const {
        x: anchorXCoord,
        y: anchorYCoord,
    } = anchorCoords;

    const lastXCoord = gridDescription.width - 1;
    const lastYCoord = gridDescription.height - 1;

    const isDeploymentHorizontal = deploymentDirection === DEPLOYMENT_DIRECTIONS.HORIZONTAL;
    const isDeploymentVertical = deploymentDirection === DEPLOYMENT_DIRECTIONS.VERTICAL;

    let errorMessage, errorDescription;

    // check for anchor coordinates are in range between (0, 0) and (lastXCoord, lastYCoord)
    {
        if (anchorXCoord < 0 || anchorXCoord > lastXCoord || anchorYCoord < 0 || anchorYCoord > lastYCoord) {
            errorMessage = "Deployment anchor is out of game grid";
            errorDescription = {
                actionPayload,
                gridDescription,
            };

            throw new DeploymentActionValidationError(errorMessage, errorDescription);
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
            errorMessage = "Ship doesn't fit into game grid";
            errorDescription = {
                actionPayload,
                gridDescription,
            };

            throw new DeploymentActionValidationError(errorMessage, errorDescription);
        }
    }

    // check for available deployment space
    {
        /* CLARIFICATION: AVAILABLE DEPLOYMENT SPACE
            between each ship, there must be at least one empty cell in any (horizontal, vertical, or diagonal) direction
        */
        const deploymentMap = createDeploymentMap(deploymentHistory, gridDescription);

        // coordinates range to check
        const fromX = anchorXCoord === 0 ? anchorXCoord : anchorXCoord - 1;
        const toX = isDeploymentHorizontal ?
            (anchorXCoord + shipLength > lastXCoord ? anchorXCoord + shipLength - 1 : anchorXCoord + shipLength) :
            (anchorXCoord === lastXCoord ? anchorXCoord : anchorXCoord + 1);

        const fromY = anchorYCoord === 0 ? anchorYCoord : anchorYCoord - 1;
        const toY = isDeploymentVertical ?
            (anchorYCoord + shipLength > lastYCoord ? anchorYCoord + shipLength - 1 : anchorYCoord + shipLength) :
            (anchorYCoord === lastYCoord? anchorYCoord : anchorYCoord - 1);

        for (let y = fromY; y <= toY; y++) {
            for (let x = fromX; x <= toX; x++) {
                if (deploymentMap[y][x].isOccupied) {
                    errorMessage = "Ship is blocked by previous single or multiple deployments";
                    errorDescription = {
                        actionPayload,
                        deploymentHistory,
                        gridDescription,
                    };

                    throw new DeploymentActionValidationError(errorMessage, errorDescription);
                }
            }
        }
    }
}

export default validateGameDeploymentAction;
