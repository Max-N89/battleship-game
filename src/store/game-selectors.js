import {createSelector} from "@reduxjs/toolkit";

import {DEPLOYMENT_DIRECTIONS} from "../constants";

const {HORIZONTAL, VERTICAL} = DEPLOYMENT_DIRECTIONS;

export const selectSettingsGridDescription = state => (
    state.game?.settings?.gridDescription
);

export const selectPlayerOpponentId = (state, playerId) => (
    state.game?.players?.entities?.[playerId]?.opponentId
);

export const selectPlayerDeploymentHistory = (state, playerId) => (
    state.game?.players?.entities?.[playerId]?.deploymentHistory
);

export const selectPlayerShotsHistory = (state, playerId) => (
    state.game?.players?.entities?.[playerId]?.shotsHistory
);

export const selectPlayerOpponentShotsHistory = (state, playerId) => {
    const opponentId = selectPlayerOpponentId(state, playerId);

    if (!opponentId) return;

    return selectPlayerShotsHistory(state, opponentId);
};

export const selectPlayerDeploymentMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        selectSettingsGridDescription,
    ],
    (deploymentHistory, gridDescription) => {
        if (!deploymentHistory || !gridDescription) return;

        const gridMap = new GridMap(gridDescription.width, gridDescription.height);

        gridMap.addDeployments(deploymentHistory);

        return gridMap;
    }
);

export const selectPlayerGameMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        (state, playerId) => selectPlayerOpponentShotsHistory(state, playerId),
        selectSettingsGridDescription,
    ],
    (playerDeploymentHistory, opponentShotsHistory, gridDescription) => {
        if (!playerDeploymentHistory || !opponentShotsHistory || !gridDescription) return;

        const gridMap = new GridMap(gridDescription.width, gridDescription.height);

        gridMap.addDeployments(playerDeploymentHistory);
        gridMap.addShots(opponentShotsHistory);

        return gridMap;
    }
);

// *** SUPPLEMENTS ***

class GridMap extends Array {
    constructor(width, height) {
        super();

        for (let yCoord = 0; yCoord <= height - 1; yCoord++) {
            const row = [];

            for (let xCoord = 0; xCoord <= width - 1; xCoord++) {
                const cell = {
                    isOccupied: false,
                    isShooted: false,
                    coords: {
                        x: xCoord,
                        y: yCoord,
                    },
                };

                row.push(cell);
            }

            this.push(row);
        }
    }

    addDeployments(deployments) {
        deployments.forEach(deploymentDescription => {
            const {
                anchorCoords: {
                    x: anchorXCoord,
                    y: anchorYCoord,
                },
                direction: deploymentDirection,
                length: shipLength,
            } = deploymentDescription;

            switch (deploymentDirection) {
                case HORIZONTAL: {
                    for (let xCoord = anchorXCoord; xCoord <= anchorXCoord + shipLength - 1; xCoord++) {
                        this[anchorYCoord][xCoord].isOccupied = true;
                    }

                    break;
                }
                case VERTICAL: {
                    for (let yCoord = anchorYCoord; yCoord <= anchorYCoord + shipLength - 1; yCoord++) {
                        this[yCoord][anchorXCoord].isOccupied = true;
                    }

                    break;
                }
            }
        });
    }

    addShots(shots) {
        shots.forEach(shotDescription => {
            const {
                coords: {
                    x: shotXCoord,
                    y: shotYCoord,
                },
            } = shotDescription;

            map[shotYCoord][shotXCoord].isShooted = true;
        });
    }
}
