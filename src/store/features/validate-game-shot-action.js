import {ShotActionValidationError} from "./store-errors";

function validateGameShotAction(actionPayload, shotsHistory, gridDescription) {
    const {
        coords: shotCoords,
    } = actionPayload;

    const {
        x: shotXCoord,
        y: shotYCoord,
    } = shotCoords;

    const lastXCoord = gridDescription.width - 1;
    const lastYCoord = gridDescription.height - 1;

    let errorMessage, errorDescription;

    // check for shot coordinates are in range between (0, 0) and (lastXCoord, lastYCoord)
    {
        if (shotXCoord < 0 || shotXCoord > lastXCoord || shotYCoord < 0 || shotYCoord > lastYCoord) {
            errorMessage = "Shot coordinates are out of game grid";
            errorDescription = {
                actionPayload,
                gridDescription,
            };

            throw new ShotActionValidationError(errorMessage, errorDescription);
        }
    }

    // check if there was shots at the same coordinates
    {
        shotsHistory.forEach(({coords: {x: prevShotXCoord, y: prevShotYCoord}}) => {
            if (shotXCoord === prevShotXCoord && shotYCoord === prevShotYCoord) {
                errorMessage = "Shot is at the same coordinates";
                errorDescription = {
                    actionPayload,
                    shotsHistory,
                };

                throw new ShotActionValidationError(errorMessage, errorDescription);
            }
        });
    }
}

export default validateGameShotAction;
