import {createSlice, nanoid} from "@reduxjs/toolkit";

import {
    selectPlayerUndeployedShips,
    selectPlayerAvailableDeploymentAnchorsCoords,
    selectPlayerNextShotsCoords,
    selectPlayersIds,
    selectScoreToWin,
    selectPlayerScore,
    selectPlayerShotsHistory,
    selectPlayerDeploymentGridMap,
    selectPlayerShotsGridMap,
} from "../game-selectors";

import {GameError} from "../../custom-errors";

const gameSlice = createSlice({
    name: "game",
    initialState: createInitState(),
    reducers: {
        deploy: {
            reducer(state, action) {
                const {playerId, deploymentHistoryRecord} = action.payload;

                state.currentSession.players.entities[playerId].deploymentHistory.push(deploymentHistoryRecord);
            },
            prepare(playerId, deploymentHistoryRecord) {
                return {
                    payload: {
                        playerId,
                        deploymentHistoryRecord,
                    }
                };
            }
        },
        shoot: {
            reducer(state, action) {
                const {playerId, shotsHistoryRecord} = action.payload;

                state.currentSession.players.entities[playerId].shotsHistory.push(shotsHistoryRecord);
            },
            prepare(playerId, shotsHistoryRecord) {
                return {
                    payload: {
                        playerId,
                        shotsHistoryRecord,
                    }
                };
            }
        },
        error: {
            reducer(state, action) {
                state.currentSession.errors.push(action.payload);
            },
            prepare(error) {
                const {message, cause} = error;

                return {
                    payload: {
                        message,
                        cause,
                    }
                };
            }
        },
        reset(state) {
            state.currentSession = createInitSession();
        },
        save(state) {
            state.prevSavedSession = JSON.stringify(state.currentSession);
        },
        continue(state, action) {
            state.currentSession = JSON.parse(action.payload);
        },
        restart(state) {
            Object.values(state.currentSession.players.entities).forEach(entity => {
                entity.deploymentHistory = [];
                entity.shotsHistory = [];
            });
        },
    }
});

export const {
    deploy: gameDeploy,
    shoot: gameShoot,
    error: gameError,
    reset: gameReset,
    save: gameSave,
    continue: gameContinue,
    restart: gameRestart,
} = gameSlice.actions;

export const gameAutoDeploy = playerId => (dispatch, getState) => {
    const state = getState();
    const undeployedShips = selectPlayerUndeployedShips(state, playerId);

    if (!undeployedShips.length) return;

    const shipEntityToDeploy = undeployedShips.length === 1 ?
        undeployedShips[0] :
        undeployedShips[getRandomInteger(0, undeployedShips.length - 1)];

    let deploymentAngle = [0, .5][getRandomInteger(0, 1)];

    /* IMPORTANT: DEPLOYMENT ANGLES
        for selectPlayerAvailableDeploymentAnchorsCoords only supported deployment angles are 0 and .5
    */
    let availableDeploymentAnchorsCoords = selectPlayerAvailableDeploymentAnchorsCoords(
        state,
        playerId,
        shipEntityToDeploy.id,
        deploymentAngle,
    );

    // switch deployment angle in case when there are no available spots for deployment with previous angle value
    if (!availableDeploymentAnchorsCoords.length) {
        deploymentAngle = deploymentAngle === 0 ? .5 : 0;

        availableDeploymentAnchorsCoords = selectPlayerAvailableDeploymentAnchorsCoords(
            state,
            playerId,
            shipEntityToDeploy.id,
            deploymentAngle,
        );
    }

    if (!availableDeploymentAnchorsCoords.length) {
        const errorMessage = "Unable to perform auto-deployment.";

        const errorCause = {
            playerId,
            deploymentMap: selectPlayerDeploymentGridMap(state, playerId),
            ship: shipEntityToDeploy,
        };

        dispatch(gameError(new GameError(errorMessage, errorCause)));

        return;
    }

    const deploymentHistoryRecord = {
        anchorCoords: availableDeploymentAnchorsCoords.length === 1 ?
            availableDeploymentAnchorsCoords[0] :
            availableDeploymentAnchorsCoords[getRandomInteger(0, availableDeploymentAnchorsCoords.length - 1)],
        angle: deploymentAngle,
        shipId: shipEntityToDeploy.id,
    }

    dispatch(gameDeploy(
        playerId,
        deploymentHistoryRecord
    ));
};

export const gameAutoShot = playerId => (dispatch, getState) => {
    const state = getState();

    /* IMPORTANT/TODO: NEXT SHOT COORDINATES
        selectPlayerNextShotsCoords is limited in search for next shot coordinates,
        currently it is not suitable for searching player's (person) next shot coordinates
        in cases when the player's successful shots are extreme for a single opponent's ship
        and there is unshooted gap between them
    */
    const nextShotCoords = selectPlayerNextShotsCoords(state, playerId);

    if (!nextShotCoords.length) {
        const errorMessage = "Unable to perform auto-shot.";
        const errorCause = {
            playerId,
            shotsMap: selectPlayerShotsGridMap(state, playerId),
        };

        dispatch(gameError(new GameError(errorMessage, errorCause)));

        return;
    }

    const shotsHistoryRecord = {
        coords: nextShotCoords.length === 1 ?
            nextShotCoords[0] : nextShotCoords[getRandomInteger(0, nextShotCoords.length - 1)],
    };

    dispatch(gameShoot(
        playerId,
        shotsHistoryRecord
    ));
};

export const gameAutoMove = () => (dispatch, getState) => {
    const state = getState();

    const [playerOneId, playerTwoId] = selectPlayersIds(state);
    const scoreToWin = selectScoreToWin(state);

    const playerOneScore = selectPlayerScore(state, playerOneId);
    const playerTwoScore = selectPlayerScore(state, playerTwoId);

    if (playerOneScore === scoreToWin || playerTwoScore === scoreToWin) {
        dispatch(gameRestart());

        return;
    }

    const playerOneUndeployedShipsIds = selectPlayerUndeployedShips(state, playerOneId);
    const playerTwoUndeployedShipsIds = selectPlayerUndeployedShips(state, playerTwoId);

    if (playerOneUndeployedShipsIds.length || playerTwoUndeployedShipsIds.length) {
        if (playerOneUndeployedShipsIds.length === playerTwoUndeployedShipsIds.length) {
            dispatch(gameAutoDeploy(playerOneId));
        } else {
            dispatch(gameAutoDeploy(playerTwoId))
        }

        return;
    }

    const playerOneShotsHistory = selectPlayerShotsHistory(state, playerOneId);
    const playerTwoShotsHistory = selectPlayerShotsHistory(state, playerTwoId);

    if (playerOneShotsHistory.length === playerTwoShotsHistory.length) {
        dispatch(gameAutoShot(playerOneId));
    } else {
        dispatch(gameAutoShot(playerTwoId));
    }
}

export default gameSlice.reducer;

// *** supplements ***

function createInitState() {
    const currentSession = createInitSession();

    return {
        currentSession,
        prevSavedSession: null
    };
}

function createShipsEntities() {
    const entities = {};

    for (let length = 4, amount = 1; length > 0; length--, amount++) {
        for (let i = 1; i <= amount; i++) {
            const id = nanoid();

            entities[id] = {
                id,
                length,
            };
        }
    }

    return entities;
}

function createInitPlayersEntities() {
    const playerOneEntity = {
        id: nanoid(),
    };
    const playerTwoEntity = {
        id: nanoid(),
    }

    playerOneEntity.opponentId = playerTwoEntity.id;
    playerTwoEntity.opponentId = playerOneEntity.id;

    return [playerOneEntity, playerTwoEntity].reduce((acc, entity) => {
        entity.deploymentHistory = [];
        entity.shotsHistory = [];

        acc[entity.id] = entity;

        return acc;
    }, {});
}

function createInitSession() {
    const initPlayersEntities = createInitPlayersEntities();
    const shipsEntities = createShipsEntities();

    return {
        id: nanoid(),
        settings: {
            gridDescription: {
                // grid coordinates range is from (0, 0) to (width - 1, height - 1)
                width: 10,
                height: 10,
            },
            ships: {
                ids: Object.keys(shipsEntities),
                entities: shipsEntities,
            },
        },
        players: {
            ids: Object.keys(initPlayersEntities),
            entities: initPlayersEntities,
        },
        errors: [],
    }
}

function getRandomInteger(min, max) {
    const rand = min + Math.random() * (max + 1 - min);

    return Math.floor(rand);
}
