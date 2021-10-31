function gameReducer(state = createGameInitState(), action) {
    switch (action.type) {
        case "game/deploy": {
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
        case "game/shoot": {
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
        case "game/reset": {
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
                width: 10,
                height: 10,
            },
            ships: {
                ids: ["battleship", "cruiser", "destroyer", "submarine"],
                entities: {
                    battleship: {
                        length: 4,
                        amount: 1,
                    },
                    cruiser: {
                        length: 3,
                        amount: 2,
                    },
                    destroyer: {
                        length: 2,
                        amount: 3,
                    },
                    submarine: {
                        length: 1,
                        amount: 4,
                    },
                },
            },
        },
        players: {
            ids: [...PLAYERS_IDS],
            entities: createPlayersInitEntities(PLAYERS_IDS),
        },
    };
}

function createPlayersInitEntities(ids) {
    return ids.reduce((acc, id) => {
        acc[id] = {
            deploymentHistory: [],
            shotsHistory: [],
        };

        return acc;
    }, {});
}
