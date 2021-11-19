import React from "react";

import GameGridCell from "./game-grid-cell";

export default function GameGrid(props) {
    const {gridMap} = props;

    return (
        <div>
            {
                gridMap.map((row, rowIndex) => (
                    <div key={rowIndex}>
                        {
                            row.map((cell, cellIndex) => {
                                const {
                                    isOccupied,
                                    isShooted,
                                } = cell;

                                return (
                                    <GameGridCell
                                        key={cellIndex}
                                        isOccupied={isOccupied}
                                        isShooted={isShooted}
                                    />
                                )
                            })
                        }
                    </div>
                ))
            }
        </div>
    );
};

