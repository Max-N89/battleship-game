import {configureStore} from "@reduxjs/toolkit";

import gameSliceReducer from "./slices/game";
import gameDeploymentActionMiddleware from "./middleware/game-deployment-action-middleware";
import gameShotActionMiddleware from "./middleware/game-shot-action-middleware";


// *** PRELOADED STATE ***

const persistedGameString = localStorage.getItem("game");

let preloadedState;

if (persistedGameString) {
    preloadedState = {
        game: JSON.parse(persistedGameString),
    };
}

// *** MIDDLEWARE ***

const middleware = getDefaultMiddleware => ([
    ...getDefaultMiddleware(),
    gameDeploymentActionMiddleware,
    gameShotActionMiddleware,
]);

// *** STORE ***

const store = configureStore({
    reducer: {
        game: gameSliceReducer,
    },
    preloadedState,
    middleware,
    devTools: true,
})

export default store;
