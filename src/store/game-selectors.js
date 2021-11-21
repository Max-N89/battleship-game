import {createSelector} from "@reduxjs/toolkit";

import {DEPLOYMENT_DIRECTIONS} from "../constants";

const {HORIZONTAL, VERTICAL} = DEPLOYMENT_DIRECTIONS;

export const selectGameGridDescription = state => (
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
        selectGameGridDescription,
    ],
    (deploymentHistory, gridDescription) => {
        if (!deploymentHistory || !gridDescription) return;

        const map = createEmptyMap(gridDescription.width, gridDescription.height);

        addDeploymentsToMap(map, deploymentHistory);

        return map;
    }
);

export const selectPlayerGameMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        (state, playerId) => selectPlayerOpponentShotsHistory(state, playerId),
        selectGameGridDescription,
    ],
    (playerDeploymentHistory, opponentShotsHistory, gridDescription) => {
        if (!playerDeploymentHistory || !opponentShotsHistory || !gridDescription) return;

        const map = createEmptyMap(gridDescription.width, gridDescription.height);

        addDeploymentsToMap(map, playerDeploymentHistory);
        addShotsToMap(map, opponentShotsHistory);

        return map;
    }
);

// *** SUPPLEMENTS ***

function createEmptyMap(width, height) {
    return  new Array(height)
        .fill(null)
        .map(row => (
            new Array(width)
                .fill(null)
                .map(cell => (
                    {
                        isOccupied: false,
                        isShooted: false,
                    }
                ))
        ));
}

function addDeploymentsToMap(map, deployments) {
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
                    map[anchorYCoord][xCoord].isOccupied = true;
                }

                break;
            }
            case VERTICAL: {
                for (let yCoord = anchorYCoord; yCoord <= anchorYCoord + shipLength - 1; yCoord++) {
                    map[yCoord][anchorXCoord].isOccupied = true;
                }

                break;
            }
        }
    });
}

function addShotsToMap(map, shots) {
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
