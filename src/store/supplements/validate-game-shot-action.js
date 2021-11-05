import {ActionValidationError} from "./store-errors";

function validateGameShotAction(action, shotsHistory, gridDescription) {
    const {
        coords: {
            x: shotXCoord,
            y: shotYCoord,
        },
    } = action.payload.shotDescription;

    const lastXCoord = gridDescription.width - 1;
    const lastYCoord = gridDescription.height - 1;

    let errorMessage;

    const errorCause = {
        action,
        shotsHistory,
        gridDescription,
    };

    // check for shot coordinates are in range between (0, 0) and (lastXCoord, lastYCoord)
    {
        if (shotXCoord < 0 || shotXCoord > lastXCoord || shotYCoord < 0 || shotYCoord > lastYCoord) {
            errorMessage = "Shot coordinates are out of game grid.";

            throw new ActionValidationError(errorMessage, errorCause);
        }
    }

    // check if there is previous shot at the same coordinates
    {
        shotsHistory.forEach(({coords: {x: prevShotXCoord, y: prevShotYCoord}}) => {
            if (shotXCoord === prevShotXCoord && shotYCoord === prevShotYCoord) {
                errorMessage = "There is a shot with the same coordinates.";

                throw new ActionValidationError(errorMessage, errorCause);
            }
        });
    }
}

export default validateGameShotAction;
