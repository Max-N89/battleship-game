import {GameError} from "../../custom-errors";

function validateGameDeploy(action, deploymentGridMap, settingsShips) {
    const {
        anchorCoords: {
            x: anchorXCoord,
            y: anchorYCoord,
        },
        angle: deploymentAngle,
        shipId,
    } = action.payload.deploymentHistoryRecord;

    const shipLength = settingsShips[shipId].length

    const {lastXCoord, lastYCoord} = deploymentGridMap;

    const xAxisFactor = Math.round(Math.sin(deploymentAngle * Math.PI));
    const yAxisFactor = Math.round(Math.cos(deploymentAngle * Math.PI));

    const xAxisShipLengthOffset = (shipLength - 1) * xAxisFactor;
    const yAxisShipLengthOffset = (shipLength - 1) * yAxisFactor;

    let errorMessage;

    const errorCause = {
        action,
        deploymentGridMap,
    };

    // check for anchor coordinates are in range between (0, 0) and (lastXCoord, lastYCoord)
    if (anchorXCoord < 0 || anchorXCoord > lastXCoord || anchorYCoord < 0 || anchorYCoord > lastYCoord) {
        errorMessage = "Deployment anchor is out of game grid.";

        throw new GameError(errorMessage, errorCause);
    }

    // check if a ship deployment is fitting into the game grid
    if (
        xAxisFactor &&
        (anchorXCoord + xAxisShipLengthOffset < 0 || anchorXCoord + xAxisShipLengthOffset > lastXCoord) ||
        yAxisFactor &&
        (anchorYCoord + yAxisShipLengthOffset < 0 || anchorYCoord + yAxisShipLengthOffset > lastYCoord)
    ) {
        errorMessage = "Deployment doesn't fit into game grid.";

        throw new GameError(errorMessage, errorCause);
    }

    // check if cells for deployment are undeployable
    if (
        deploymentGridMap.isAreaContaining(
            {isUndeployable: true},
            {x: anchorXCoord, y: anchorYCoord},
            {x: anchorXCoord + xAxisShipLengthOffset, y: anchorYCoord + yAxisShipLengthOffset}
        )
    ) {
        errorMessage = "Deployment is blocked by one of the previous ones.";

        throw new GameError(errorMessage, errorCause);
    }
}

export default validateGameDeploy;
