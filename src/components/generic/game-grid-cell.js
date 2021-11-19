import React from "react";

import squareWhiteSrc from "../../../assets/game-grid-cells/square-white.svg";
import squareBlackSrc from "../../../assets/game-grid-cells/square-black.svg";
import starSkullSrc from "../../../assets/game-grid-cells/star-skull.svg";
import splashSrc from "../../../assets/game-grid-cells/splash.svg";

export default function GameGridCell(props) {
    const {
        xCoord,
        yCoord,
        isOccupied,
        isShooted,
    } = props;

    let imgSrc, imgAlt;

    imgSrc = squareWhiteSrc;
    imgAlt = "White square; empty cell without shot or ship";

    if (isShooted || isOccupied) {
        if (isShooted && isOccupied) {
            imgSrc = starSkullSrc;
            imgAlt = "Shattered black square with red highlight and skull at the middle; cell with successful shot";
        } else if (isShooted) {
            imgSrc = splashSrc;
            imgAlt = "White square with splash; cell with missed shot";
        } else if (isOccupied) {
            imgSrc = squareBlackSrc;
            imgAlt = "Black square; cell with ship";
        }
    }

    return (
        <img
            alt={imgAlt}
            src={imgSrc}
        />
    );
};
