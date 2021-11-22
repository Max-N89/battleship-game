import {createSlice, nanoid} from "@reduxjs/toolkit";

import {
    selectPlayerUndeployedShips,
    selectPlayerAvailableDeploymentAnchors,
} from "../game-selectors";

import {DEPLOYMENT_DIRECTIONS} from "../../constants";

const {HORIZONTAL, VERTICAL} = DEPLOYMENT_DIRECTIONS;

const gameSlice = createSlice({
    name: "game",
    initialState: createInitState(),
    reducers: {
        deploy: {
            reducer(state, action) {
                const {playerId, deploymentDescription} = action.payload;

                state.players.entities[playerId].deploymentHistory.push(deploymentDescription);
            },
            prepare(playerId, deploymentDescription) {
                return {
                    payload: {
                        playerId,
                        deploymentDescription,
                    }
                };
            }
        },
        shoot: {
            reducer(state, action) {
                const {playerId, shotDescription} = action.payload;

                state.players.entities[playerId].shotsHistory.push(shotDescription);
            },
            prepare(playerId, shotDescription) {
                return {
                    payload: {
                        playerId,
                        shotDescription,
                    }
                };
            }
        },
        reset(state) {
            Object.values(state.players.entities).forEach(entity => {
                entity.deploymentHistory = [];
                entity.shotsHistory = [];
            });
        },
        error: {
            reducer(state, action) {
                state.errors.push(action.payload);
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
    }
});

export const {
    deploy: gameDeploy,
    shoot: gameShoot,
    reset: gameReset,
    error: gameError,
} = gameSlice.actions;

export const gameAutoDeploy = playerId => (dispatch, getState) => {
    const state = getState();
    const undeployedShips = selectPlayerUndeployedShips(state, playerId);
    const shipDescriptionToDeploy = undeployedShips.length === 1 ?
        undeployedShips[0] :
        undeployedShips[getRandomInteger(0, undeployedShips.length - 1)];
    const deploymentDescription = {
        length: shipDescriptionToDeploy.length,
        direction: [HORIZONTAL, VERTICAL][getRandomInteger(0, 1)],
    };

    let availableDeploymentAnchors = selectPlayerAvailableDeploymentAnchors(
        state,
        playerId,
        deploymentDescription.direction,
        deploymentDescription.length
    );

    // switch deployment direction in case when there are no available spots to deploy with previous direction
    if (!availableDeploymentAnchors.length) {
        deploymentDescription.direction = deploymentDescription.direction === HORIZONTAL ?
            VERTICAL :
            HORIZONTAL;

        availableDeploymentAnchors = selectPlayerAvailableDeploymentAnchors(
            state,
            playerId,
            deploymentDescription.direction,
            deploymentDescription.length
        );
    }

    deploymentDescription.anchorCoords = availableDeploymentAnchors.length === 1 ?
        availableDeploymentAnchors[0] :
        availableDeploymentAnchors[getRandomInteger(0, availableDeploymentAnchors.length - 1)];

    dispatch(gameDeploy(
        playerID,
        deploymentDescription
    ));
};

export default gameSlice.reducer;

// *** SUPPLEMENTS ***

function createInitState() {
    const initPlayersEntities = createInitPlayersEntities();
    const shipsEntities = createShipsEntities();

    return {
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

function getRandomInteger(min, max) {
    const rand = min + Math.random() * (max + 1 - min);

    return Math.floor(rand);
}
