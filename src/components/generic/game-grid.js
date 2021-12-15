import React from "react";

import GameGridCell from "./game-grid-cell";

import "./game-grid.css"

function GameGrid(props) {
    const {gridMap} = props;

    return (
        <div className="game-grid">
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
