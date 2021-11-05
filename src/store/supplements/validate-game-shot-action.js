import {GameError} from "../../custom-errors";

const {SHOT} = GameError.MESSAGES;

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
            errorMessage = SHOT.IS_OUTSIDE;

            throw new GameError(errorMessage, errorCause);
        }
    }

    // check if there is previous shot at the same coordinates
    {
        shotsHistory.forEach(({coords: {x: prevShotXCoord, y: prevShotYCoord}}) => {
            if (shotXCoord === prevShotXCoord && shotYCoord === prevShotYCoord) {
                errorMessage = SHOT.IS_SAME;

                throw new GameError(errorMessage, errorCause);
            }
        });
    }
}

export default validateGameShotAction;
