import {createSelector} from "@reduxjs/toolkit";

import {GameError} from "../custom-errors";

export const selectCurrentSession = state => (
    state.game?.currentSession
);

export const selectPrevSavedSession = state => (
    state.game?.prevSavedSession
);

export const selectErrors = state => (
    selectCurrentSession(state)?.errors
);

export const selectSettingsGridDescription = state => (
    selectCurrentSession(state)?.settings?.gridDescription
);
/*
export const selectSettingsShipsIds = state => (
    selectCurrentSession(state)?.settings?.ships?.ids
);
*/
export const selectSettingsShips = state => (
    selectCurrentSession(state)?.settings?.ships?.entities
);

export const selectPlayersIds = state => (
    selectCurrentSession(state)?.players?.ids
);

export const selectPlayers = state => (
    selectCurrentSession(state)?.players?.entities
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

export const selectPlayerDeploymentGridMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        selectSettingsShips,
        selectSettingsGridDescription,
    ],
    (deploymentHistory, settingsShips, settingsGridDescription) => {
        if (!deploymentHistory || !settingsShips || !settingsGridDescription) return;

        const deploymentsDescriptions = deploymentHistory.map(({anchorCoords, angle, shipId}) => ({
            anchorCoords,
            angle,
            length: settingsShips[shipId].length,
        }));

        const {width, height} = settingsGridDescription;

        return new DeploymentGridMap(width, height, deploymentsDescriptions);
    }
);

export const selectPlayerShotsGridMap = createSelector(
    [
        (state, playerId) => selectPlayerShotsHistory(state, playerId),
        (state, playerId) => selectPlayerDeploymentGridMap(state, selectPlayerOpponentId(state, playerId)),
        selectSettingsGridDescription,
    ],
    (playerShotsHistory, opponentDeploymentGridMap, settingsGridDescription) => {
        if (!playerShotsHistory || !opponentDeploymentGridMap || !settingsGridDescription) return;

        const playerShotsDescriptions = playerShotsHistory.map(({coords}) => ({
            coords,
        }));

        const {width, height} = settingsGridDescription;

        return new ShotsGridMap(width, height, playerShotsDescriptions, opponentDeploymentGridMap);
    }
);

export const selectPlayerAvailableDeploymentAnchorsCoords = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentGridMap(state, playerId),
        (state, playerId, shipId) => selectSettingsShips(state)?.[shipId]?.length,
        (state, playerId, shipId, deploymentAngle) => deploymentAngle,
    ],
    (deploymentGridMap, shipLength, deploymentAngle) => {
        if (!deploymentGridMap || !shipLength || deploymentAngle === undefined) return;

        const alongXAxis = Boolean(Math.round(Math.sin(deploymentAngle * Math.PI)));

        /* IMPORTANT: DEPLOYMENT ANGLES
            bottleneck for valid deployment angles (0 and .5), checkout sequence.slice()
            for removing angle limitations
        */
        return deploymentGridMap.getContinuousCellsSequence({isUndeployable: false}, alongXAxis)
            .filter(sequence => sequence.length >= shipLength)
            .map(sequence => sequence.slice(0, sequence.length - (shipLength - 1)))
            .flat();
    }
);

export const selectPlayerNextShotsCoords = createSelector(
    [
        (state, playerId) => selectPlayerShotsGridMap(state, playerId),
        selectSettingsShips,
    ],
    (shotsGridMap, settingsShips) => {
        if (!shotsGridMap || !settingsShips) return;

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

        // check for next shots coordinates at possibly unfinished shots sequences and count sunken ships with length more than 1
        {
            const allSuccessfulShotsSequences = [
                ...shotsGridMap.getContinuousCellsSequence({isShotSuccessful: true}, true),
                ...shotsGridMap.getContinuousCellsSequence({isShotSuccessful: true}, false),
            ]
                .sort((a, b) => b.length - a.length)
                .filter(sequence => sequence.length > 1);

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

                let angle = successfulShotsSequenceExtremeCoords[0].x === successfulShotsSequenceExtremeCoords[1].x ?
                    0 : .5;

                let i = 0;

                for (angle, i; angle < 2; angle++, i++) {
                    if (
                        isAdjacentShotsSequencePossible(
                            angle,
                            1,
                            successfulShotsSequenceExtremeCoords[i],
                            shotsGridMap
                        )
                    ) {
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

        // check for next shots coordinates at successful single shots and count sunken ships with length equal to one
        {
            maxNotSunkShipLength = getMaxNotSunkShipLength(shipsAmountsByLength);

            const allSuccessfulSingleShotsCoords = getSuccessfulSingleShotsCoords(shotsGridMap);

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
                                shotsGridMap
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

            return getSearchShotsCoords(maxNotSunkShipLength, shotsGridMap);
        }

        // *** supplements ***

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
                shotsMap.isAreaContaining(
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

            // minimal (if in absolute values) axis offsets
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

            // maximum (if in absolute values) axis offsets
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

            isPossible = !shotsMap.isAreaContaining(
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
                            adjacentCellXCoord < 0 ||
                            adjacentCellXCoord > lastXCoord ||
                            adjacentCellYCoord < 0 ||
                            adjacentCellYCoord > lastYCoord
                        ) {
                            continue;
                        }

                        if (shotsMap[adjacentCellYCoord][adjacentCellXCoord].isShotSuccessful) {
                            continue loopOverShotsMapXCoord
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
                        shotsMap.isAreaContaining(
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

                    allSearchShotsDescriptions.push(searchShotDescription);

                    if (shipLength === 1) {
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

export const selectPlayerGameGridMap = createSelector(
    [
        (state, playerId) => selectPlayerDeploymentHistory(state, playerId),
        (state, playerId) => selectPlayerShotsHistory(state, selectPlayerOpponentId(state, playerId)),
        selectSettingsShips,
        selectSettingsGridDescription,
    ],
    (playerDeploymentHistory, opponentShotsHistory, settingsShips, settingsGridDescription) => {
        if (!playerDeploymentHistory || !opponentShotsHistory || !settingsShips || !settingsGridDescription) return;

        const playerDeploymentsDescriptions = playerDeploymentHistory.map(({anchorCoords, angle, shipId}) => ({
            anchorCoords,
            angle,
            length: settingsShips[shipId].length,
        }));

        const opponentShotsDescriptions = opponentShotsHistory.map(({coords}) => ({
            coords,
        }));

        const {width, height} = settingsGridDescription;

        return new GameGridMap(width, height, playerDeploymentsDescriptions, opponentShotsDescriptions);
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
    const shotsMap = selectPlayerShotsGridMap(state, playerId);

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

export const selectIsCurrentSessionOngoing = state => (
    Object.values(selectPlayers(state)).some(playerEntity => playerEntity.deploymentHistory.length)
);

// *** supplements ***

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

    getContinuousCellsSequence(cellProps, alongXAxis) {
        const allContinuousSequences = [];

        const {lastYCoord, lastXCoord} = this;

        let continuousSequence = [];

        let perpendicularAxisLastCoord, alongAxisLastCoord;

        if (alongXAxis) {
            perpendicularAxisLastCoord = lastYCoord;
            alongAxisLastCoord = lastXCoord;
        } else {
            perpendicularAxisLastCoord = lastXCoord;
            alongAxisLastCoord = lastYCoord;
        }

        for (let perpendicularAxisCoord = 0; perpendicularAxisCoord <= perpendicularAxisLastCoord; perpendicularAxisCoord++) {
            for (let alongAxisCoord = 0; alongAxisCoord <= alongAxisLastCoord; alongAxisCoord++) {

                let xCoord, yCoord;

                if (alongXAxis) {
                    xCoord = alongAxisCoord;
                    yCoord = perpendicularAxisCoord;
                } else {
                    xCoord = perpendicularAxisCoord;
                    yCoord = alongAxisCoord;
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

    isAreaContaining(cellProps, areaFromCoords, areaToCoords) {
        const fromXCoord = Math.min(areaFromCoords.x, areaToCoords.x);
        const toXCoord = Math.max(areaFromCoords.x, areaToCoords.x);
        const fromYCoord = Math.min(areaFromCoords.y, areaToCoords.y);
        const toYCoord = Math.max(areaFromCoords.y, areaToCoords.y);

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

    static get [Symbol.species]() {
        return Array;
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

            const xAxisShipLengthOffset = (shipLength - 1) * xAxisFactor;
            const yAxisShipLengthOffset = (shipLength - 1) * yAxisFactor;

            const fromXCoord = Math.min(anchorXCoord, anchorXCoord + xAxisShipLengthOffset);
            const toXCoord = Math.max(anchorXCoord, anchorXCoord + xAxisShipLengthOffset);
            const fromYCoord = Math.min(anchorYCoord, anchorYCoord + yAxisShipLengthOffset);
            const toYCoord = Math.max(anchorYCoord, anchorYCoord + yAxisShipLengthOffset);

            for (let yCoord = fromYCoord; yCoord <= toYCoord; yCoord++) {
                for (let xCoord = fromXCoord; xCoord <= toXCoord; xCoord++) {
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

class DeploymentGridMap extends GridMap {
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

            const xAxisShipLengthOffset = (shipLength - 1) * xAxisFactor;
            const yAxisShipLengthOffset = (shipLength - 1) * yAxisFactor;

            // minimal (if in absolute values) axis offsets
            const [minXAxisOffset, minYAxisOffset] = [
                {
                    anchorAxisCoord: anchorXCoord,
                    axisFactor: xAxisFactor,
                    lastAxisCoord: lastXCoord,
                },
                {
                    anchorAxisCoord: anchorYCoord,
                    axisFactor: yAxisFactor,
                    lastAxisCoord: lastYCoord
                }
            ].map(({anchorAxisCoord, axisFactor, lastAxisCoord}) => (
                axisFactor ?
                    (
                        anchorAxisCoord - axisFactor < 0 || anchorAxisCoord - axisFactor > lastAxisCoord ?
                            0 : -axisFactor
                    ) :
                    (
                        anchorAxisCoord === 0 ? 0 : -1
                    )
            ));

            // maximum (if in absolute values) axis offsets
            const [maxXAxisOffset, maxYAxisOffset] = [
                {
                    anchorAxisCoord: anchorXCoord,
                    axisShipLengthOffset: xAxisShipLengthOffset,
                    axisFactor: xAxisFactor,
                    lastAxisCoord: lastXCoord,
                },
                {
                    anchorAxisCoord: anchorYCoord,
                    axisShipLengthOffset: yAxisShipLengthOffset,
                    axisFactor: yAxisFactor,
                    lastAxisCoord: lastYCoord
                }
            ].map(({anchorAxisCoord, axisShipLengthOffset, axisFactor, lastAxisCoord}) => (
                axisFactor ?
                    (
                        (
                            anchorAxisCoord + axisShipLengthOffset + axisFactor < 0 ||
                            anchorAxisCoord + axisShipLengthOffset + axisFactor > lastAxisCoord
                        ) ?
                            axisShipLengthOffset : axisShipLengthOffset + axisFactor
                    ) :
                    (
                        anchorAxisCoord === lastAxisCoord ? 0 : 1
                    )
            ));

            const fromXCoord = anchorXCoord + Math.min(minXAxisOffset, maxXAxisOffset);
            const toXCoord = anchorXCoord + Math.max(minXAxisOffset, maxXAxisOffset);
            const fromYCoord = anchorYCoord + Math.min(minYAxisOffset, maxYAxisOffset);
            const toYCoord = anchorYCoord + Math.max(minYAxisOffset, maxYAxisOffset);

            for (let yCoord = fromYCoord; yCoord <= toYCoord; yCoord++) {
                for (let xCoord = fromXCoord; xCoord <= toXCoord; xCoord++) {
                    if (this[yCoord][xCoord].isUndeployable) continue;

                    this[yCoord][xCoord].isUndeployable = true;
                }
            }
        });
    }
}

class ShotsGridMap extends GridMap {
    constructor(width, height, playerShotsDescriptions, opponentDeploymentGridMap) {
        super(width, height, {isShooted: false});

        this.constructor.addShots(this, playerShotsDescriptions);

        playerShotsDescriptions.forEach(description => {
            const {
                coords: {
                    x: shotXCoord,
                    y: shotYCoord,
                },
            } = description;

            if (opponentDeploymentGridMap[shotYCoord][shotXCoord].isOccupied) this[shotYCoord][shotXCoord].isShotSuccessful = true;
        });
    }
}

class GameGridMap extends GridMap {
    constructor(width, height, playerDeploymentsDescriptions, opponentShotsDescriptions) {
        super(width, height, {isOccupied: false, isShooted: false});

        this.constructor.addDeployments(this, playerDeploymentsDescriptions);
        this.constructor.addShots(this, opponentShotsDescriptions);
    }
}
