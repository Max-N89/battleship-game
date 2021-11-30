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

        const deploymentsDescriptions = deploymentHistory.map(({anchorCoords, angle, shipId}) => ({
            anchorCoords,
            angle,
            length: settingsShips[shipId].length,
        }));

        const {width: mapWidth, height: mapHeight} = gridDescription;

        return new DeploymentMap(mapWidth, mapHeight, deploymentsDescriptions);
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

        const playerShotsDescriptions = playerShotsHistory.map(({coords}) => ({
            coords,
        }));

        const {width: mapWidth, height: mapHeight} = gridDescription;

        return new ShotsMap(mapWidth, mapHeight, playerShotsDescriptions, opponentDeploymentMap);
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

        return deploymentMap.getContinuousCellsSequence({isUndeployable: false}, deploymentDirection)
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

        const {lastXCoord, lastYCoord} = shotsMap;
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

        let maxNotSunkShipLength;

        // check for next shots coords at possibly unfinished shots sequences and count sunken ships with length more than 1
        {
            const allSuccessfulShotsSequences = [
                ...shotsMap.getContinuousCellsSequence({isShotSuccessful: true}, HORIZONTAL),
                ...shotsMap.getContinuousCellsSequence({isShotSuccessful: true}, VERTICAL),
            ]
                .sort((a, b) => b.length - a.length)
                .filter(area => area.length > 1);

            if (allSuccessfulShotsSequences.length) allSuccessfulShotsSequences.forEach(successfulShotsSequence => {
                maxNotSunkShipLength = getMaxNotSunkShipLength(shipsAmountsByLength);

                const nextShotsInSequenceCoords = [];

                if (successfulShotsSequence.length === maxNotSunkShipLength) {
                    shipsAmountsByLength.get(successfulShotsSequence.length).sunken++;
                    return;
                }

                const successfulShotsSequenceExtremeCoords = [
                    successfulShotsSequence[successfulShotsSequence.length - 1],
                    successfulShotsSequence[0]
                ];

                for (
                    let angle = successfulShotsSequenceExtremeCoords[0].x === successfulShotsSequenceExtremeCoords[1].x ? 0.5 : 0, i = 0;
                    angle < 2;
                    angle++, i++
                ) {
                    if (isAdjacentShotsSequencePossible(angle, 1, successfulShotsSequenceExtremeCoords[i], shotsMap)) {
                        nextShotsInSequenceCoords.push({
                            x: successfulShotsSequenceExtremeCoords[i].x + Math.round(Math.sin(angle * Math.PI)),
                            y: successfulShotsSequenceExtremeCoords[i].y + Math.round(Math.cos(angle * Math.PI))
                        });
                    }
                }

                if (nextShotsInSequenceCoords.length) {
                    nextShotsCoords.push(...nextShotsInSequenceCoords);
                } else {
                    shipsAmountsByLength.get(successfulShotsSequence.length).sunken++
                }
            });

            if (nextShotsCoords.length) return nextShotsCoords;
        }

        // check for next shots coords at successful single shots and count sunken ships with length equal to one
        {
            maxNotSunkShipLength = getMaxNotSunkShipLength(shipsAmountsByLength);

            const allSuccessfulSingleShotsCoords = getSuccessfulSingleShotsCoords(shotsMap);

            if (maxNotSunkShipLength > 1 && allSuccessfulSingleShotsCoords.length) {
                allSuccessfulSingleShotsCoords.forEach(successfulSingleShotCoords => {
                    const allAdjacentShotsCoords = [];

                    const minNotSunkShipLengthLongerThanOne = getMinNotSunkShipLengthLongerThanOne(shipsAmountsByLength)

                    for (let angle = 0; angle < 2; angle += .5) {
                        if (
                            isAdjacentShotsSequencePossible(
                                angle,
                                minNotSunkShipLengthLongerThanOne - 1,
                                successfulSingleShotCoords,
                                shotsMap
                            )
                        ) {
                            allAdjacentShotsCoords.push({
                                x: successfulSingleShotCoords.x + Math.round(Math.sin(angle * Math.PI)),
                                y: successfulSingleShotCoords.y + Math.round(Math.cos(angle * Math.PI))
                            });
                        }
                    }

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
            maxNotSunkShipLength = getMaxNotSunkShipLength(shipsAmountsByLength);

            return getSearchShotsCoords(maxNotSunkShipLength, shotsMap);
        }

        // *** SUPPLEMENTS ***

        function getMaxNotSunkShipLength(shipsAmountsByLength) {
            const notSunkShipsLengths = Array.from(shipsAmountsByLength.keys())
                .filter(shipLength => {
                    const shipAmounts = shipsAmountsByLength.get(shipLength);

                    return shipAmounts.total > shipAmounts.sunken;
                });

            return notSunkShipsLengths.length ? Math.max(...notSunkShipsLengths) : undefined;
        }

        function getMinNotSunkShipLengthLongerThanOne(shipsAmountsByLength) {
            const notSunkShipsLengths = Array.from(shipsAmountsByLength.keys())
                .filter(shipLength => {
                    const shipAmounts = shipsAmountsByLength.get(shipLength);

                    return shipAmounts.total > shipAmounts.sunken && shipLength > 1;
                });

            return notSunkShipsLengths.length ? Math.min(...notSunkShipsLengths) : undefined;
        }

        function isAdjacentShotsSequencePossible(angle, shotsSequenceLength, adjacentToCellCoords, shotsMap) {
            const {lastXCoord, lastYCoord} = shotsMap;
            const {x: adjacentToCellXCoord, y: adjacentToCellYCoord} = adjacentToCellCoords;

            const xAxisFactor = Math.round(Math.sin(angle * Math.PI));
            const yAxisFactor = Math.round(Math.cos(angle * Math.PI));

            const firstInAdjacentShotsSequenceXCoord = adjacentToCellXCoord + xAxisFactor;
            const lastInAdjacentShotsSequenceXCoord = adjacentToCellXCoord + shotsSequenceLength * xAxisFactor;
            const firstInAdjacentShotsSequenceYCoord = adjacentToCellYCoord + yAxisFactor;
            const lastInAdjacentShotsSequenceYCoord = adjacentToCellYCoord + shotsSequenceLength * yAxisFactor;

            let isPossible = true;

            if (
                lastInAdjacentShotsSequenceXCoord < 0 ||
                lastInAdjacentShotsSequenceXCoord > lastXCoord ||
                lastInAdjacentShotsSequenceYCoord < 0 ||
                lastInAdjacentShotsSequenceYCoord > lastYCoord ||
                shotsMap.isMapAreaContaining(
                    {isShooted: true},
                    {x: firstInAdjacentShotsSequenceXCoord, y: firstInAdjacentShotsSequenceYCoord},
                    {x: lastInAdjacentShotsSequenceXCoord, y: lastInAdjacentShotsSequenceYCoord})
            ) {
                isPossible = false;

                return isPossible;
            }

            if (
                shotsSequenceLength === 1 && (
                    xAxisFactor && (lastInAdjacentShotsSequenceXCoord === 0 || lastInAdjacentShotsSequenceXCoord === lastXCoord) ||
                    yAxisFactor && (lastInAdjacentShotsSequenceYCoord === 0 || lastInAdjacentShotsSequenceYCoord === lastYCoord)
                )
            ) {
                return isPossible;
            }

            const [minXAxisOffset, minYAxisOffset] = [
                {
                    adjacentToCellAxisCoord: adjacentToCellXCoord,
                    axisFactor: xAxisFactor
                },
                {
                    adjacentToCellAxisCoord: adjacentToCellYCoord,
                    axisFactor: yAxisFactor
                }
            ].map(({adjacentToCellAxisCoord, axisFactor}) => (
                axisFactor ?
                    2 * axisFactor :
                    (adjacentToCellAxisCoord === 0 ? 0 : -1)
            ));

            const [maxXAxisOffset, maxYAxisOffset] = [
                {
                    adjacentToCellAxisCoord: adjacentToCellXCoord,
                    lastInAdjacentShotsSequenceAxisCoord: lastInAdjacentShotsSequenceXCoord,
                    lastAxisCoord: lastXCoord,
                    axisFactor: xAxisFactor
                },
                {
                    adjacentToCellAxisCoord: adjacentToCellYCoord,
                    lastInAdjacentShotsSequenceAxisCoord: lastInAdjacentShotsSequenceYCoord,
                    lastAxisCoord: lastYCoord,
                    axisFactor: yAxisFactor
                }
            ].map(({adjacentToCellAxisCoord, lastInAdjacentShotsSequenceAxisCoord, lastAxisCoord, axisFactor}) => (
                axisFactor ?
                    (
                        lastInAdjacentShotsSequenceAxisCoord === 0 || lastInAdjacentShotsSequenceAxisCoord === lastAxisCoord ?
                            shotsSequenceLength * axisFactor :
                            (shotsSequenceLength + 1) * axisFactor
                    ) :
                    (adjacentToCellAxisCoord === lastAxisCoord ? 0 : 1)
            ));

            const fromXCoord = adjacentToCellXCoord + minXAxisOffset;
            const toXCoord = adjacentToCellXCoord + maxXAxisOffset;

            const fromYCoord = adjacentToCellYCoord + minYAxisOffset;
            const toYCoord = adjacentToCellYCoord + maxYAxisOffset;

            isPossible = !shotsMap.isMapAreaContaining(
                {isShotSuccessful: true},
                {x: fromXCoord, y: fromYCoord},
                {x: toXCoord, y: toYCoord}
            );

            return isPossible;
        }

        function getSuccessfulSingleShotsCoords(shotsMap) {
            const successfulSingleShotsCoords = [];

            const {lastXCoord, lastYCoord} = shotsMap;

            for (let yCoord = 0; yCoord <= lastYCoord; yCoord++) {
                loopOverShotsMapXCoord: for (let xCoord = 0; xCoord <= lastXCoord; xCoord++) {
                    if (!shotsMap[yCoord][xCoord].isShotSuccessful) continue;

                    for (let angle = 0; angle < 2; angle += .5) {
                        const adjacentCellXCoord = xCoord + Math.round(Math.sin(angle * Math.PI));
                        const adjacentCellYCoord = yCoord + Math.round(Math.cos(angle * Math.PI));

                        if (
                            adjacentCellXCoord >= 0 &&
                            adjacentCellXCoord <= lastXCoord &&
                            adjacentCellYCoord >= 0 &&
                            adjacentCellYCoord <= lastYCoord &&
                            shotsMap[adjacentCellYCoord][adjacentCellXCoord].isShotSuccessful
                        ) {
                            continue loopOverShotsMapXCoord;
                        }
                    }

                    successfulSingleShotsCoords.push({x: xCoord, y: yCoord});
                }
            }

            return successfulSingleShotsCoords;
        }

        function getSearchShotsCoords(shipLength, shotsMap) {
            let allSearchShotsDescriptions = [];

            const {lastXCoord, lastYCoord} = shotsMap;

            for (let yCoord = 0; yCoord <= lastYCoord; yCoord++) {
                for (let xCoord = 0; xCoord <= lastXCoord; xCoord++) {

                    if (shotsMap[yCoord][xCoord].isShooted) continue;

                    const fromXCoord = xCoord === 0 ? 0 : xCoord - 1;
                    const toXCoord = xCoord === lastXCoord ? lastXCoord : xCoord + 1;
                    const fromYCoord = yCoord === 0 ? 0 : yCoord - 1;
                    const toYCoord = yCoord === lastYCoord ? lastYCoord : yCoord + 1;

                    if (
                        shotsMap.isMapAreaContaining(
                            {isShotSuccessful: true},
                            {x: fromXCoord, y: fromYCoord},
                            {x: toXCoord, y: toYCoord}
                            )
                    ) continue;

                    const searchShotDescription = {
                        coords: {
                            x: xCoord,
                            y: yCoord,
                        },
                        possibleDirections: 0
                    };

                    if (shipLength === 1) {
                        allSearchShotsDescriptions.push(searchShotDescription);
                        continue;
                    }

                    for (let angle = 0; angle < 2; angle += .5) {
                        if (
                            isAdjacentShotsSequencePossible(
                                angle,
                                shipLength - 1,
                                searchShotDescription.coords,
                                shotsMap
                            )
                        ) {
                            searchShotDescription.possibleDirections++;
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

        const playerDeploymentsDescriptions = playerDeploymentHistory.map(({anchorCoords, angle, shipId}) => ({
            anchorCoords,
            angle,
            length: settingsShips[shipId].length,
        }));

        const opponentShotsDescriptions = opponentShotsHistory.map(({coords}) => ({
            coords,
        }));

        const {width: mapWidth, height: mapHeight} = gridDescription;

        return new GameMap(mapWidth, mapHeight, playerDeploymentsDescriptions, opponentShotsDescriptions);
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

    getContinuousCellsSequence(cellProps, direction) {
        const allContinuousSequences = [];

        const {lastYCoord, lastXCoord} = this;

        /*
            picking continuous cells sequences that lie in map rows (horizontal direction)
            or in columns (vertical direction);
            iterate first over Y coordinates for checking rows
            or over X coordinates for checking columns respectively
        */

        let continuousSequence = [];
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
                    if (continuousSequence.length) {
                        allContinuousSequences.push(continuousSequence);
                        continuousSequence = [];
                    }

                    continue;
                }

                continuousSequence.push({x: xCoord, y: yCoord});
            }

            if (continuousSequence.length) {
                allContinuousSequences.push(continuousSequence);
            }

            continuousSequence = [];
        }

        return allContinuousSequences;
    }

    isMapAreaContaining(cellProps, fromCellCoords, toCellCoords) {
        if (fromCellCoords.x === toCellCoords.x && fromCellCoords.y === toCellCoords.y) return;

        const fromXCoord = Math.min(fromCellCoords.x, toCellCoords.x);
        const toXCoord = Math.max(fromCellCoords.x, toCellCoords.x);
        const fromYCoord = Math.min(fromCellCoords.y, toCellCoords.y);
        const toYCoord = Math.max(fromCellCoords.y, toCellCoords.y);

        const {lastXCoord, lastYCoord} = this;

        if (fromXCoord < 0 || toXCoord > lastXCoord || fromYCoord < 0 || toYCoord > lastYCoord) return;

        let isContaining = false;

        loopOverAreaYCoord: for (let yCoord = fromYCoord; yCoord <= toYCoord; yCoord++) {
            for (let xCoord = fromXCoord; xCoord <= toXCoord; xCoord++) {
                if (
                    Object.entries(cellProps)
                        .every(([key, value]) => this[yCoord][xCoord][key] === value)
                ) {
                    isContaining = true;
                    break loopOverAreaYCoord;
                }
            }
        }

        return isContaining;
    }

    static addDeployments(gridMap, deploymentsDescriptions) {
        deploymentsDescriptions.forEach(description => {
            const {
                anchorCoords: {
                    x: anchorXCoord,
                    y: anchorYCoord,
                },
                angle: deploymentAngle,
                length: shipLength,
            } = description;

            const xAxisFactor = Math.round(Math.sin(deploymentAngle * Math.PI));
            const yAxisFactor = Math.round(Math.cos(deploymentAngle * Math.PI));

            const xAxisOffset = (shipLength - 1) * xAxisFactor;
            const yAxisOffset = (shipLength - 1) * yAxisFactor;

            for (let yCoord = anchorYCoord; yCoord <= anchorYCoord + yAxisOffset; yCoord++) {
                for (let xCoord = anchorXCoord; xCoord <= anchorXCoord + xAxisOffset; xCoord++) {
                    gridMap[yCoord][xCoord].isOccupied = true;
                }
            }
        });
    }

    static addShots(gridMap, shotsDescriptions) {
        shotsDescriptions.forEach(description => {
            const {
                coords: {
                    x: shotXCoord,
                    y: shotYCoord,
                },
            } = description;

            gridMap[shotYCoord][shotXCoord].isShooted = true;
        });
    }
}

class DeploymentMap extends GridMap {
    constructor(width, height, deploymentsDescriptions) {
        super(width, height, {isOccupied: false, isUndeployable: false});

        this.constructor.addDeployments(this, deploymentsDescriptions);

        deploymentsDescriptions.forEach(description => {
            const {
                anchorCoords: {
                    x: anchorXCoord,
                    y: anchorYCoord,
                },
                angle: deploymentAngle,
                length: shipLength,
            } = description;

            // cells which become undeployable
            /* CLARIFICATION: UNDEPLOYABLE SPACE
                between each ship must be at least one empty cell in any (horizontal, vertical, or diagonal) direction
            */
            const {lastXCoord, lastYCoord} = this;

            const xAxisFactor = Math.round(Math.sin(deploymentAngle * Math.PI));
            const yAxisFactor = Math.round(Math.cos(deploymentAngle * Math.PI));

            const xAxisOffset = (shipLength - 1) * xAxisFactor;
            const yAxisOffset = (shipLength - 1) * yAxisFactor;

            const fromXCoord = anchorXCoord === 0 ? 0 : anchorXCoord - 1;
            const toXCoord = anchorXCoord + xAxisOffset + 1 > lastXCoord ? lastXCoord : anchorXCoord + xAxisOffset + 1;

            const fromYCoord = anchorYCoord === 0 ? 0 : anchorYCoord - 1;
            const toYCoord = anchorYCoord + yAxisOffset + 1 > lastYCoord ? lastYCoord : anchorYCoord + yAxisOffset + 1;

            for (let yCoord = fromYCoord; yCoord <= toYCoord; yCoord++) {
                for (let xCoord = fromXCoord; xCoord <= toXCoord; xCoord++) {
                    if (deploymentMap[yCoord][xCoord].isUndeployable) continue;

                    deploymentMap[yCoord][xCoord].isUndeployable = true;
                }
            }
        });
    }
}

class ShotsMap extends GridMap {
    constructor(width, height, playerShotsDescriptions, opponentDeploymentMap) {
        super(width, height, {isShooted: false});

        this.constructor.addShots(this, playerShotsDescriptions);

        playerShotsDescriptions.forEach(description => {
            const {
                coords: {
                    x: shotXCoord,
                    y: shotYCoord,
                },
            } = description;

            if (opponentDeploymentMap[shotYCoord][shotXCoord].isOccupied) this[shotYCoord][shotXCoord].isShotSuccessful = true;
        });
    }
}

class GameMap extends GridMap {
    constructor(width, height, playerDeploymentsDescriptions, opponentShotsDescriptions) {
        super(width, height, {isOccupied: false, isShooted: false});

        this.constructor.addDeployments(this, playerDeploymentsDescriptions);
        this.constructor.addShots(this, opponentShotsDescriptions);
    }
}
