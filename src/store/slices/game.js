import {createSlice} from "@reduxjs/toolkit";

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
            state.players.entities = createInitPlayersEntities(state.players.ids);
        },
        error: {
            reducer(state, action) {
                state.errors.push(action.payload);
            },
            prepare(message, cause) {
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
    const PLAYERS_IDS = ["a", "b"];

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
            ids: [...PLAYERS_IDS],
            entities: createInitPlayersEntities(PLAYERS_IDS),
        },
        errors: [],
    };
}

function createInitPlayersEntities(ids) {
    return ids.reduce((acc, id) => {
        acc[id] = {
            id,
            deploymentHistory: [],
            shotsHistory: [],
        };

        return acc;
    }, {});
}
