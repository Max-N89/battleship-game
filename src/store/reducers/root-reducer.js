import gameReducer from "./game-reducer";

function rootReducer(state = {}, action) {
    return {
        game: gameReducer(state.game, action),
    };
}

export default rootReducer;
