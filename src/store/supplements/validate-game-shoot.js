import {GameError} from "../../custom-errors";

function validateGameShoot(action, shotsHistory, gridDescription) {
    const {
        coords: {
            x: shotXCoord,
            y: shotYCoord,
        },
    } = action.payload.shotsHistoryRecord;

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

            throw new GameError(errorMessage, errorCause);
        }
    }

    // check if there is a previous shot with the same coordinates
    {
        shotsHistory.forEach(({coords: {x: prevShotXCoord, y: prevShotYCoord}}) => {
            if (shotXCoord === prevShotXCoord && shotYCoord === prevShotYCoord) {
                errorMessage = "Shot with the same coordinates as one of the previous ones.";

                throw new GameError(errorMessage, errorCause);
            }
        });
    }
}

export default validateGameShoot;
