import {createSelector} from "@reduxjs/toolkit";

import {DIRECTIONS} from "../constants";
import {GameError} from "../custom-errors";

const {HORIZONTAL, VERTICAL, UP, DOWN, LEFT, RIGHT} = DIRECTIONS;

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
    selectPlayers(state)?.[playerId]
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
        if (!deploymentHistory || !settingsShips) return;

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

        const deploymentMap = new GridMap(gridDescription.width, gridDescription.height, {isOccupied: false, isUndeployable: false});

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

            // cells which become occupied
            switch (deploymentDirection) {
                case HORIZONTAL: {
                    for (let xCoord = anchorXCoord; xCoord <= anchorXCoord + (shipLength - 1); xCoord++) {
                        deploymentMap[anchorYCoord][xCoord].isOccupied = true;
                    }

                    break;
                }
                case VERTICAL: {
                    for (let yCoord = anchorYCoord; yCoord <= anchorYCoord + (shipLength - 1); yCoord++) {
                        deploymentMap[yCoord][anchorXCoord].isOccupied = true;
                    }

                    break;
                }
            }

            // cells which become undeployable
            /* CLARIFICATION: UNDEPLOYABLE SPACE
                between each ship must be at least one empty cell in any (horizontal, vertical, or diagonal) direction
            */
            const {lastXCoord, lastYCoord} = deploymentMap;

            const fromXCoord = anchorXCoord === 0 ? 0 : anchorXCoord - 1;

            const toXCoord = isDeploymentHorizontal ?
                (anchorXCoord + shipLength > lastXCoord ? anchorXCoord + (shipLength - 1) : anchorXCoord + shipLength) :
                (anchorXCoord === lastXCoord ? lastXCoord : anchorXCoord + 1);

            const fromYCoord = anchorYCoord === 0 ? 0 : anchorYCoord - 1;

            const toYCoord = isDeploymentVertical ?
                (anchorYCoord + shipLength > lastYCoord ? anchorYCoord + (shipLength - 1) : anchorYCoord + shipLength) :
                (anchorYCoord === lastYCoord? lastYCoord : anchorYCoord + 1);

            for (let yCoord = fromYCoord; yCoord <= toYCoord; yCoord++) {
                for (let xCoord = fromXCoord; xCoord <= toXCoord; xCoord++) {
                    if (deploymentMap[yCoord][xCoord].isUndeployable) continue;

                    deploymentMap[yCoord][xCoord].isUndeployable = true;
                }
            }
        });

        return deploymentMap;
    }
);

export const selectPlayerShotsMap = createSelector(
    [
        (state, playerId) => selectPlayerShotsHistory(state, playerId),
        (state, playerId) => selectPlayerDeploymentMap(state, selectPlayerOpponentId(state, playerId)),
        selectSettingsGridDescription,
    ],
    (playerShotsHistory, opponentDeploymentMap, gridDescription) => {
        if (!playerShotsHistory || !opponentDeploymentMap || !gridDescription) return;

        const playerShotsMap = new GridMap(gridDescription.width, gridDescription.height, {isShooted: false});

        playerShotsHistory.forEach(shotDescription => {
            const {
                coords: {
                    x: shotXCoord,
                    y: shotYCoord,
                },
            } = shotDescription;

            const playerShotsMapCell = playerShotsMap[shotYCoord][shotXCoord];

            playerShotsMapCell.isShooted = true;

            if (opponentDeploymentMap[shotYCoord][shotXCoord].isOccupied) playerShotsMapCell.isShotSuccessful = true;
        });

        return playerShotsMap;
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

export const selectPlayerNextShotsCoords = createSelector(
    [
        (state, playerId) => selectPlayerShotsMap(state, playerId),
        selectSettingsShips,
    ],
    (shotsMap, settingsShips) => {
        if (!shotsMap || !settingsShips) return;

        const nextShotsCoords = [];
        const shipsAmountsByLength = new Map();

        for (let {length: shipLength} of Object.values(settingsShips)) {
            if (!shipsAmountsByLength.has(shipLength)) {
                shipsAmountsByLength.set(shipLength, {
                    total: 1,
                    sunken: 0,
                });
            } else {
                shipsAmountsByLength.get(shipLength).total++;
            }
        }

        let maxShipLength;

        // check for next shots coords at possibly unfinished shots sequences and count sunken ships with length more than 1
        {
            const successfulShotsSequences = [
                ...shotsMap.getContinuousAreas({isShotSuccessful: true}, HORIZONTAL),
                ...shotsMap.getContinuousAreas({isShotSuccessful: true}, VERTICAL),
            ]
                .sort((a, b) => b.length - a.length)
                .filter(area => area.length > 1);

            successfulShotsSequences.forEach(shotsSequence => {
                maxShipLength = getPossibleMaxShipLength(shipsAmountsByLength);

                const nextShotsSequenceCoords = [];

                if (shotsSequence.length === maxShipLength) {
                    shipsAmountsByLength.get(maxShipLength).sunken++;
                    return;
                }

                const {
                    x: sequenceFirstXCoord,
                    y: sequenceFirstYCoord,
                } = shotsSequence[0];

                const {
                    x: sequenceLastXCoord,
                    y: sequenceLastYCoord,
                } = shotsSequence[shotsSequence.length - 1];

                // vertical areas
                if (sequenceFirstXCoord === sequenceLastXCoord) {
                    const topAdjacentShotCoords = getAdjacentShotCoords(UP, {
                        x: sequenceFirstXCoord,
                        y: sequenceFirstYCoord
                    }, shotsMap);

                    const bottomAdjacentShotCoords = getAdjacentShotCoords(DOWN, {
                        x: sequenceLastXCoord,
                        y: sequenceLastYCoord
                    }, shotsMap);

                    nextShotsSequenceCoords.push(...[topAdjacentShotCoords, bottomAdjacentShotCoords].filter(shotCoords => Boolean(shotCoords)));
                }

                // horizontal areas
                if (sequenceFirstYCoord === sequenceLastYCoord) {
                    const leftAdjacentShotCoords = getAdjacentShotCoords(LEFT, {
                        x: sequenceFirstXCoord,
                        y: sequenceFirstYCoord
                    }, shotsMap);
                    const rightAdjacentShotCoords = getAdjacentShotCoords(RIGHT, {
                        x: sequenceLastXCoord,
                        y: sequenceLastYCoord
                    }, shotsMap);

                    nextShotsSequenceCoords.push(...[leftAdjacentShotCoords, rightAdjacentShotCoords].filter(shotCoords => Boolean(shotCoords)));
                }

                if (nextShotsSequenceCoords.length) {
                    nextShotsCoords.push(...nextShotsSequenceCoords);
                } else {
                    shipsAmountsByLength.get(shotsSequence.length).sunken++
                }
            });

            if (nextShotsCoords.length) return nextShotsCoords;
        }

        // check for next shots coords at successful single shots and count sunken ships with length equal to 1
        {
            maxShipLength = getPossibleMaxShipLength(shipsAmountsByLength);

            const successfulSingleShotsCoords = getSuccessfulSingleShotsCoords(shotsMap);

            if (maxShipLength > 1 && successfulSingleShotsCoords.length) {
                successfulSingleShotsCoords.forEach(singleShotCoords => {
                    const allAdjacentShotsCoords = [];

                    [UP, DOWN, LEFT, RIGHT].forEach(direction => {
                        const adjacentShotCoords = getAdjacentShotCoords(direction, singleShotCoords, shotsMap);

                        if (adjacentShotCoords) allAdjacentShotsCoords.push(adjacentShotCoords);
                    });

                    if (allAdjacentShotsCoords.length) {
                        nextShotsCoords.push(...allAdjacentShotsCoords);
                    } else {
                        shipsAmountsByLength.get(1).sunken++;
                    }
                });
            }

            if (nextShotsCoords.length) return nextShotsCoords;
        }

        // get "search" shots coords
        {
            maxShipLength = getPossibleMaxShipLength(shipsAmountsByLength);

            return getSearchShotsCoords(maxShipLength, shotsMap);
        }

        function getPossibleMaxShipLength(shipsAmountsByLength) {
            const shipsLengths = Array.from(shipsAmountsByLength.keys())
                .filter(shipLength => {
                    const shipAmounts = shipsAmountsByLength.get(shipLength);

                    return shipAmounts.total > shipAmounts.sunken;
                });

            return Math.max(...shipsLengths);
        }

        function getAdjacentShotCoords(direction, adjacentToShotCoords, shotsMap) {
            const {lastXCoord, lastYCoord} = shotsMap;
            const {x: adjacentToShotXCoord, y: adjacentToShotYCoord} = adjacentToShotCoords;

            let adjacentShotCoords;

            switch (direction) {
                case UP: {
                    if (
                        adjacentToShotYCoord === 0 ||
                        (adjacentToShotYCoord >= 1 && shotsMap[adjacentToShotYCoord - 1][adjacentToShotXCoord].isShooted)
                    ) return;

                    if (adjacentToShotYCoord === 1) {
                        adjacentShotCoords = {x: adjacentToShotXCoord, y: adjacentToShotYCoord - 1};

                        break;
                    }

                    if (adjacentToShotYCoord > 1) {
                        const fromXCoord = adjacentToShotXCoord === 0 ? 0 : adjacentToShotXCoord - 1;
                        const toXCoord = adjacentToShotXCoord === lastXCoord ? lastXCoord : adjacentToShotXCoord + 1;

                        for (let xCoord = fromXCoord; xCoord <= toXCoord; xCoord++) {
                            if (shotsMap[adjacentToShotYCoord - 2][xCoord].isShotSuccessful) return;
                        }
                    }

                    adjacentShotCoords = {x: adjacentToShotXCoord, y: adjacentToShotYCoord - 1};

                    break;
                }
                case DOWN: {
                    if (
                        adjacentToShotYCoord === lastYCoord ||
                        (adjacentToShotYCoord <= lastYCoord - 1 && shotsMap[adjacentToShotYCoord + 1][adjacentToShotXCoord].isShooted)
                    ) return;

                    if (adjacentToShotYCoord === lastYCoord - 1) {
                        adjacentShotCoords = {x: adjacentToShotXCoord, y: adjacentToShotYCoord + 1};

                        break;
                    }

                    if (adjacentToShotYCoord < lastYCoord - 1) {
                        const fromXCoord = adjacentToShotXCoord === 0 ? 0 : adjacentToShotXCoord - 1;
                        const toXCoord = adjacentToShotXCoord === lastXCoord ? lastXCoord : adjacentToShotXCoord + 1;

                        for (let xCoord = fromXCoord; xCoord <= toXCoord; xCoord++) {
                            if (shotsMap[adjacentToShotYCoord + 2][xCoord].isShotSuccessful) return;
                        }
                    }

                    adjacentShotCoords = {x: adjacentToShotXCoord, y: adjacentToShotYCoord + 1}

                    break;
                }
                case LEFT: {
                    if (
                        adjacentToShotXCoord === 0 ||
                        (adjacentToShotXCoord >= 1 && shotsMap[adjacentToShotYCoord][adjacentToShotXCoord - 1].isShooted)
                    ) return;

                    if (adjacentToShotXCoord === 1) {
                        adjacentShotCoords = {x: adjacentToShotXCoord - 1, y: adjacentToShotYCoord};

                        break;
                    }

                    if (adjacentToShotXCoord > 1) {
                        const fromYCoord = adjacentToShotYCoord === 0 ? 0 : adjacentToShotYCoord - 1;
                        const toYCoord = adjacentToShotYCoord === lastYCoord ? lastYCoord : adjacentToShotYCoord + 1;

                        for (let yCoord = fromYCoord; yCoord <= toYCoord; yCoord++) {
                            if (shotsMap[yCoord][adjacentToShotXCoord - 2].isShotSuccessful) return;
                        }
                    }

                    adjacentShotCoords = {x: adjacentToShotXCoord - 1, y: adjacentToShotYCoord};

                    break;
                }
                case RIGHT: {
                    if (
                        adjacentToShotXCoord === lastXCoord ||
                        (adjacentToShotXCoord <= lastXCoord - 1 && shotsMap[adjacentToShotYCoord][adjacentToShotXCoord + 1].isShooted)
                    ) return;

                    if (adjacentToShotXCoord === lastXCoord - 1) {
                        adjacentShotCoords = {x: adjacentToShotXCoord + 1, y: adjacentToShotYCoord};

                        break;
                    }

                    if (adjacentToShotXCoord < lastXCoord - 1) {
                        const fromYCoord = adjacentToShotYCoord === 0 ? 0 : adjacentToShotYCoord - 1;
                        const toYCoord = adjacentToShotYCoord === lastYCoord ? lastYCoord : adjacentToShotYCoord + 1;

                        for (let yCoord = fromYCoord; yCoord <= toYCoord; yCoord++) {
                            if (shotsMap[yCoord][adjacentToShotXCoord + 2].isShotSuccessful) return;
                        }
                    }

                    adjacentShotCoords = {x: adjacentToShotXCoord + 1, y: adjacentToShotYCoord};

                    break;
                }
            }

            return adjacentShotCoords;
        }

        function getSuccessfulSingleShotsCoords(shotsMap) {
            const successfulSingleShotsCoords = [];

            const {lastXCoord, lastYCoord} = shotsMap;

            for (let yCoord = 0; yCoord <= lastYCoord; yCoord++) {
                for (let xCoord = 0; xCoord <= lastXCoord; xCoord++) {
                    if (!shotsMap[yCoord][xCoord].isShotSuccessful) continue;

                    const topAdjacentCell = yCoord > 0 ? shotsMap[yCoord - 1][xCoord] : undefined;
                    const bottomAdjacentCell = yCoord < lastYCoord ? shotsMap[yCoord + 1][xCoord] : undefined;
                    const leftAdjacentCell = xCoord > 0 ? shotsMap[yCoord][xCoord - 1] : undefined;
                    const rightAdjacentCell = xCoord < lastXCoord ? shotsMap[yCoord][xCoord + 1] : undefined;

                    if (
                        [topAdjacentCell, bottomAdjacentCell, leftAdjacentCell, rightAdjacentCell]
                            .filter(cell => Boolean(cell))
                            .every(cell => !cell.isShotSuccessful)
                    ) {
                        successfulSingleShotsCoords.push({x: xCoord, y: yCoord});
                    }
                }
            }

            return successfulSingleShotsCoords;
        }

        function getSearchShotsCoords(shipLength, shotsMap) {
            let allSearchShotsDescriptions = [];

            const {lastXCoord, lastYCoord} = shotsMap;

            for (let yCoord = 0; yCoord <= lastYCoord; yCoord++) {
                loopOverShotsMapXCoord: for (let xCoord = 0; xCoord <= lastXCoord; xCoord++) {

                    if (shotsMap[yCoord][xCoord].isShooted) continue;

                    const searchShotDescription = {
                        coords: {
                            x: null,
                            y: null,
                        },
                        possibleDirections: 0
                    };

                    // check for shot block by previous successful shots
                    {
                        const fromXCoord = xCoord === 0 ? 0 : xCoord - 1;
                        const toXCoord = xCoord === lastXCoord ? lastXCoord : xCoord + 1;
                        const fromYCoord = yCoord === 0 ? 0 : yCoord - 1;
                        const toYCoord = yCoord === lastYCoord ? lastYCoord : yCoord + 1;

                        for (let checkYCoord = fromYCoord; checkYCoord <= toYCoord; checkYCoord++) {
                            for (let checkXCoord = fromXCoord; checkXCoord <= toXCoord; checkXCoord++) {
                                if (checkXCoord === xCoord && checkYCoord === yCoord) continue;

                                if (shotsMap[checkYCoord][checkXCoord].isShotSuccessful) continue loopOverShotsMapXCoord;
                            }
                        }

                        searchShotDescription.coords.x = xCoord;
                        searchShotDescription.coords.y = yCoord;

                        if (shipLength === 1) {
                            allSearchShotsDescriptions.push(searchShotDescription);
                            continue;
                        }
                    }

                    // check for the number of directions in which a ship could be placed at these coordinates
                    {
                        let isUpDirectionPossible = true;

                        if (yCoord - (shipLength - 1) < 0) {
                            isUpDirectionPossible = false;
                        } else {
                            for (let checkYCoord = yCoord; checkYCoord > yCoord - (shipLength - 1); checkYCoord--) {
                                if (!getAdjacentShotCoords(UP, {x: xCoord, y: checkYCoord}, shotsMap)) {
                                    isUpDirectionPossible = false;
                                    break;
                                }
                            }
                        }

                        if (isUpDirectionPossible) searchShotDescription.possibleDirections++;

                        let isDownDirectionPossible = true;

                        if (yCoord + (shipLength - 1) > lastYCoord) {
                            isDownDirectionPossible = false;
                        } else {
                            for (let checkYCoord = yCoord; checkYCoord < yCoord + (shipLength - 1); checkYCoord++) {
                                if (!getAdjacentShotCoords(DOWN, {x: xCoord, y: checkYCoord}, shotsMap)) {
                                    isDownDirectionPossible = false;
                                    break;
                                }
                            }
                        }

                        if (isDownDirectionPossible) searchShotDescription.possibleDirections++;

                        let isLeftDirectionPossible = true;

                        if (xCoord - (shipLength - 1) < 0) {
                            isLeftDirectionPossible = false;
                        } else {
                            for (let checkXCoord = xCoord; checkXCoord > xCoord - (shipLength - 1); checkXCoord--) {
                                if (!getAdjacentShotCoords(LEFT, {x: checkXCoord, y: yCoord}, shotsMap)) {
                                    isLeftDirectionPossible = false;
                                    break;
                                }
                            }
                        }

                        if (isLeftDirectionPossible) searchShotDescription.possibleDirections++;

                        let isRightDirectionPossible = true;

                        if (xCoord + (shipLength - 1) > lastXCoord) {
                            isRightDirectionPossible = false;
                        } else {
                            for (let checkXCoord = xCoord; checkXCoord < xCoord + (shipLength - 1); checkXCoord++) {
                                if (!getAdjacentShotCoords(RIGHT, {x: checkXCoord, y: yCoord}, shotsMap)) {
                                    isRightDirectionPossible = false;
                                    break;
                                }
                            }
                        }

                        if (isRightDirectionPossible) searchShotDescription.possibleDirections++;

                        if (searchShotDescription.possibleDirections) {
                            allSearchShotsDescriptions.push(searchShotDescription);
                        }
                    }
                }
            }

            if (shipLength !== 1) {
                const maxPossibleDirections = Math.max(
                    ...allSearchShotsDescriptions.map(({possibleDirections}) => possibleDirections)
                );

                allSearchShotsDescriptions = allSearchShotsDescriptions
                    .filter(({possibleDirections}) => possibleDirections === maxPossibleDirections);
            }

            return allSearchShotsDescriptions.map(({coords: {x, y}}) => ({x, y}))
        }
    }
);

export const selectScoreToWin = state => {
    const settingsShips = selectSettingsShips(state);

    if (!settingsShips) return;

    let scoreToWin = 0;

    for (let {length} of Object.values(settingsShips)) {
        scoreToWin += length;
    }

    return scoreToWin;
};

export const selectPlayerScore = (state, playerId) => {
    const shotsMap = selectPlayerShotsMap(state, playerId);

    if (!shotsMap) return;

    const {lastXCoord, lastYCoord} = shotsMap;

    let score = 0;

    for (let yCoord = 0; yCoord <= lastYCoord; yCoord++) {
        for (let xCoord = 0; xCoord <= lastXCoord; xCoord++) {
            if (shotsMap[yCoord][xCoord].isShotSuccessful) score++;
        }
    }

    return score;
};

export const selectPlayerGameMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        (state, playerId) => selectPlayerShotsHistory(state, selectPlayerOpponentId(state, playerId)),
        selectSettingsShips,
        selectSettingsGridDescription,
    ],
    (playerDeploymentHistory, opponentShotsHistory, settingsShips, gridDescription) => {
        if (!playerDeploymentHistory || !opponentShotsHistory || !settingsShips || !gridDescription) return;

        const playerGameMap = new GridMap(gridDescription.width, gridDescription.height, {isOccupied: false, isShooted: false});

        playerDeploymentHistory.forEach(deploymentDescription => {
            const {
                anchorCoords: {
                    x: anchorXCoord,
                    y: anchorYCoord,
                },
                direction: deploymentDirection,
                shipId,
            } = deploymentDescription;

            const shipLength = settingsShips[shipId].length;

            // cells which become occupied
            switch (deploymentDirection) {
                case HORIZONTAL: {
                    for (let xCoord = anchorXCoord; xCoord <= anchorXCoord + (shipLength - 1); xCoord++) {
                        playerGameMap[anchorYCoord][xCoord].isOccupied = true;
                    }

                    break;
                }
                case VERTICAL: {
                    for (let yCoord = anchorYCoord; yCoord <= anchorYCoord + (shipLength - 1); yCoord++) {
                        playerGameMap[yCoord][anchorXCoord].isOccupied = true;
                    }

                    break;
                }
            }
        });

        opponentShotsHistory.forEach(shotDescription => {
            const {
                coords: {
                    x: shotXCoord,
                    y: shotYCoord,
                },
            } = shotDescription;

            playerGameMap[shotYCoord][shotXCoord].isShooted = true;
        });

        return playerGameMap;
    }
);

// *** SUPPLEMENTS ***

class GridMap extends Array {
    constructor(width, height, cellInitValues = {}) {
        super();

        if (width <= 0 || height <= 0) {
            const errorMessage = "Invalid game grid description."

            let errorCause = {};

            if (width <= 0) errorCause.width;
            if (height <= 0) errorCause.height;

            throw new GameError(errorMessage, errorCause);
        }

        for (let yCoord = 0; yCoord <= height - 1; yCoord++) {
            const row = [];

            for (let xCoord = 0; xCoord <= width - 1; xCoord++) {
                const cell = {
                    ...cellInitValues,
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

    getContinuousAreas(cellProps, direction) {
        const continuousAreas = [];

        const {lastYCoord, lastXCoord} = this;

        /*
            to pick continuous areas depending on direction;
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
