import {createSelector} from "@reduxjs/toolkit";

import {DEPLOYMENT_DIRECTIONS} from "../constants";

const {HORIZONTAL, VERTICAL} = DEPLOYMENT_DIRECTIONS;

export const selectGameGridDescription = state => (
    state.game?.settings?.gridDescription
);

export const selectPlayerDeploymentHistory = (state, playerId) => (
    state.game?.players?.entities?.[playerId]?.deploymentHistory
);

export const selectPlayerShotsHistory = (state, playerId) => (
    state.game?.players?.entities?.[playerId]?.shotsHistory
);

export const selectPlayerDeploymentMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        selectGameGridDescription,
    ],
    (deploymentHistory, gridDescription) => {
        if (!deploymentHistory || !gridDescription) return;

        const deploymentMap = new Array(gridDescription.height)
            .fill(null)
            .map(row => (
                new Array(gridDescription.width)
                    .fill(null)
                    .map(cell => (
                        {
                            isOccupied: false,
                        }
                    ))
            ));

        deploymentHistory.forEach(previousDeployment => {
            const {
                anchorCoords: {
                    x: anchorXCoord,
                    y: anchorYCoord,
                },
                direction: deploymentDirection,
                length: shipLength,
            } = previousDeployment;

            switch (deploymentDirection) {
                case HORIZONTAL: {
                    for (let x = anchorXCoord; x <= anchorXCoord + shipLength - 1; x++) {
                        deploymentMap[anchorYCoord][x].isOccupied = true;
                    }

                    break;
                }
                case VERTICAL: {
                    for (let y = anchorYCoord; y <= anchorYCoord + shipLength - 1; y++) {
                        deploymentMap[y][anchorXCoord].isOccupied = true;
                    }

                    break;
                }
            }
        });

        return deploymentMap;
    }
);
