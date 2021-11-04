import {STORE_ACTIONS_TYPES} from "../constants";

const {GAME_DEPLOY, GAME_SHOOT, GAME_RESET} = STORE_ACTIONS_TYPES;

function gameReducer(state = createGameInitState(), action) {
    // handling exceptions for "game/deploy" and "game/shoot" actions
    if (
        action.error && (
            action.type === GAME_DEPLOY ||
            action.type === GAME_SHOOT
        )
    ) {
        return {
            ...state,
            errors: [
                ...state.errors,
                action.payload,
            ],
        };
    }

    switch (action.type) {
        case GAME_DEPLOY: {
            const {playerId, anchorCoords, direction, length} = action.payload;
            const {x, y} = anchorCoords;

            return {
                ...state,
                players: {
                    ...state.players,
                    entities: {
                        ...state.players.entities,
                        [playerId]: {
                            ...state.players.entities[playerId],
                            deploymentHistory: [
                                ...state.players.entities[playerId].deploymentHistory,
                                {
                                    anchorCoords: {
                                        x, y
                                    },
                                    direction,
                                    length,
                                },
                            ],
                        },
                    },
                },
            };
        }
        case GAME_SHOOT: {
            const {playerId, coords} = action.payload;
            const {x, y} = coords;

            return {
                ...state,
                players: {
                    ...state.players,
                    entities: {
                        ...state.players.entities,
                        [playerId]: {
                            ...state.players.entities[playerId],
                            shotsHistory: [
                                ...state.players.entities[playerId].shotsHistory,
                                {
                                    coords: {
                                        x, y
                                    }
                                },
                            ],
                        },
                    },
                },
            };
        }
        case GAME_RESET: {
            return {
                ...state,
                players: {
                    ...state.players,
                    entities: createPlayersInitEntities(state.players.ids),
                },
            };
        }
        default:
            return state;
    }
}

export default gameReducer;

// *** SUPPLEMENTS ***

function createGameInitState() {
    const PLAYERS_IDS = ["a", "b"];

    return {
        settings: {
            grid: {
                // grid coordinates range is from (0, 0) to (width - 1, height - 1)
                width: 10,
                height: 10,
            },
            ships: {
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
                    },
                },
            },
        },
        players: {
            entities: createPlayersInitEntities(PLAYERS_IDS),
        },
        errors: [],
    };
}

function createPlayersInitEntities(ids) {
    return ids.reduce((acc, id) => {
        acc[id] = {
            id,
            deploymentHistory: [],
            shotsHistory: [],
        };

        return acc;
    }, {});
}
