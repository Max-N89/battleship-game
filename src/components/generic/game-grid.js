import React from "react";

import GameGridCell from "./game-grid-cell";

function GameGrid(props) {
    const {gridMap} = props;

    return (
        <div>
            {
                gridMap.flat().map((cell, i) => {
                    {
                        const {
                            isOccupied,
                            isShooted,
                        } = cell;

                        return (
                            <GameGridCell
                                key={i}
                                isOccupied={isOccupied}
                                isShooted={isShooted}
                            />
                        )
                    }
                })
            }
        </div>
    );
}

export default GameGrid;
