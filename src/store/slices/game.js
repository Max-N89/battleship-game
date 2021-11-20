import {createSlice, nanoid} from "@reduxjs/toolkit";

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

export default gameSlice.reducer;

// *** SUPPLEMENTS ***

function createInitState() {
    const initPlayersEntities = createInitPlayersEntities();

    return {
        settings: {
            gridDescription: {
                // grid coordinates range is from (0, 0) to (width - 1, height - 1)
                width: 10,
                height: 10,
            },
            ships: {
                ids: ["battleship", "cruiser", "destroyer", "submarine"],
                entities: {
                    battleship: {
                        id: "battleship",
                        length: 4,
                        amount: 1,
                    },
                    cruiser: {
                        id: "cruiser",
                        length: 3,
                        amount: 2,
                    },
                    destroyer: {
                        id: "destroyer",
                        length: 2,
                        amount: 3,
                    },
                    submarine: {
                        id: "submarine",
                        length: 1,
                        amount: 4,
                    }
                },
            },
        },
        players: {
            ids: Object.keys(initPlayersEntities),
            entities: initPlayersEntities,
        },
        errors: [],
    };
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
