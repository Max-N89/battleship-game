import {createSelector} from "@reduxjs/toolkit";

import {DIRECTIONS} from "../constants";

const {HORIZONTAL, VERTICAL} = DIRECTIONS;

export const selectErrors = state => (
    state.game?.errors
);

export const selectSettingsGridDescription = state => (
    state.game?.settings?.gridDescription
);
/*
export const selectSettingsShipsIds = state => (
    state.game?.settings?.ships?.ids
);
*/
export const selectSettingsShips = state => (
    state.game?.settings?.ships?.entities
);

export const selectPlayersIds = state => (
    state.game?.players?.ids
);

export const selectPlayers = state => (
    state.game?.players?.entities
);

export const selectPlayerEntity = (state, playerId) => (
    state.game?.players?.entities?.[playerId]
);

export const selectPlayerDeploymentHistory = (state, playerId) => (
    selectPlayerEntity(state, playerId)?.deploymentHistory
);

export const selectPlayerShotsHistory = (state, playerId) => (
    selectPlayerEntity(state, playerId)?.shotsHistory
);

export const selectPlayerOpponentId = (state, playerId) => (
    selectPlayerEntity(state, playerId)?.opponentId
);

export const selectPlayerOpponentShotsHistory = (state, playerId) => {
    const opponentId = selectPlayerOpponentId(state, playerId);

    if (!opponentId) return;

    return selectPlayerShotsHistory(state, opponentId);
};

export const selectPlayerUndeployedShips = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        selectSettingsShips
    ],
    (deploymentHistory, settingsShips) => {
        const deployedShipsIds = new Set(deploymentHistory.map(({shipId}) => shipId));

        return Object.values(settingsShips).filter(({id}) => !deployedShipsIds.has(id));
    }
);

export const selectPlayerDeploymentMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        selectSettingsShips,
        selectSettingsGridDescription,
    ],
    (deploymentHistory, settingsShips, gridDescription) => {
        if (!deploymentHistory || !settingsShips || !gridDescription) return;

        const gridMap = new GridMap(gridDescription.width, gridDescription.height);

        gridMap.addDeployments(deploymentHistory, settingsShips);

        return gridMap;
    }
);

export const selectPlayerAvailableDeploymentAnchors = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentMap(state, playerId),
        (state, playerId, shipId) => selectSettingsShips(state)?.[shipId]?.length,
        (state, playerId, shipId, deploymentDirection) => deploymentDirection,
    ],
    (deploymentMap, shipLength, deploymentDirection) => {
        if (!deploymentMap || !shipLength || !deploymentDirection) return;



        return deploymentMap.getContinuousAreas({isUndeployable: false}, deploymentDirection)
            .filter(area => area.length >= shipLength)
            .map(area => area.slice(0, area.length - (shipLength - 1)))
            .flat();
    }
);

export const selectPlayerGameMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        (state, playerId) => selectPlayerOpponentShotsHistory(state, playerId),
        selectSettingsShips,
        selectSettingsGridDescription,
    ],
    (playerDeploymentHistory, opponentShotsHistory, settingsShips, gridDescription) => {
        if (!playerDeploymentHistory || !opponentShotsHistory || !settingsShips || !gridDescription) return;

        const gridMap = new GridMap(gridDescription.width, gridDescription.height);

        gridMap.addDeployments(playerDeploymentHistory, settingsShips);
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
                    isUndeployable: false,
                };

                row.push(cell);
            }

            this.push(row);
        }
    }

    get lastXCoord() {
        return this[0].length - 1;
    }

    get lastYCoord() {
        return this.length - 1;
    }

    addDeployments(deploymentHistory, settingsShips) {
        deploymentHistory.forEach(deploymentDescription => {
            const {
                anchorCoords: {
                    x: anchorXCoord,
                    y: anchorYCoord,
                },
                direction: deploymentDirection,
                shipId,
            } = deploymentDescription;

            const shipLength = settingsShips[shipId].length;

            const isDeploymentHorizontal = deploymentDirection === HORIZONTAL;
            const isDeploymentVertical = deploymentDirection === VERTICAL;

            // cells which are become occupied
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

            // cells which are become undeployable
            /* CLARIFICATION: UNDEPLOYABLE SPACE
                between each ship must be at least one empty cell in any (horizontal, vertical, or diagonal) direction
            */
            const {lastXCoord, lastYCoord} = this;

            const fromXCoord = anchorXCoord === 0 ? anchorXCoord : anchorXCoord - 1;

            const toXCoord = isDeploymentHorizontal ?
                (anchorXCoord + shipLength > lastXCoord ? anchorXCoord + shipLength - 1 : anchorXCoord + shipLength) :
                (anchorXCoord === lastXCoord ? anchorXCoord : anchorXCoord + 1);

            const fromYCoord = anchorYCoord === 0 ? anchorYCoord : anchorYCoord - 1;

            const toYCoord = isDeploymentVertical ?
                (anchorYCoord + shipLength > lastYCoord ? anchorYCoord + shipLength - 1 : anchorYCoord + shipLength) :
                (anchorYCoord === lastYCoord? anchorYCoord : anchorYCoord + 1);

            for (let yCoord = fromYCoord; yCoord <= toYCoord; yCoord++) {
                for (let xCoord = fromXCoord; xCoord <= toXCoord; xCoord++) {
                    if (!this[yCoord][xCoord].isUndeployable) {
                        this[yCoord][xCoord].isUndeployable = true;
                    }
                }
            }
        });
    }

    addShots(shotsHistory) {
        shotsHistory.forEach(shotDescription => {
            const {
                coords: {
                    x: shotXCoord,
                    y: shotYCoord,
                },
            } = shotDescription;

            this[shotYCoord][shotXCoord].isShooted = true;
        });
    }

    getContinuousAreas(cellProps, direction) {
        const continuousAreas = [];

        const {lastYCoord, lastXCoord} = this;

        /*
            to pick continuous areas depending on direction,
            iterate first over Y coordinates for horizontal direction
            or over X coordinates for vertical direction respectively
        */

        let continuousArea = [];
        let firstLoopLastCoord, secondLoopLastCoord;

        switch (direction) {
            case HORIZONTAL:
                firstLoopLastCoord = lastYCoord;
                secondLoopLastCoord = lastXCoord;

                break;
            case VERTICAL:
                firstLoopLastCoord = lastXCoord;
                secondLoopLastCoord = lastYCoord;

                break;
        }

        for (let firstLoopCoord = 0; firstLoopCoord <= firstLoopLastCoord; firstLoopCoord++) {
            for (let secondLoopCoord = 0; secondLoopCoord <= secondLoopLastCoord; secondLoopCoord++) {

                let xCoord, yCoord;

                switch (direction) {
                    case HORIZONTAL:
                        xCoord = secondLoopCoord;
                        yCoord = firstLoopCoord;

                        break;
                    case VERTICAL:
                        xCoord = firstLoopCoord;
                        yCoord = secondLoopCoord;

                        break;
                }

                if (
                    !Object.entries(cellProps)
                        .every(([key, value]) => this[yCoord][xCoord][key] === value)
                ) {
                    if (continuousArea.length) {
                        continuousAreas.push(continuousArea);
                        continuousArea = [];
                    }

                    continue;
                }

                continuousArea.push({x: xCoord, y: yCoord});
            }

            if (continuousArea.length) {
                continuousAreas.push(continuousArea);
            }

            continuousArea = [];
        }

        return continuousAreas;
    }
}
