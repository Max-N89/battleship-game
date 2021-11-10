import {configureStore} from "@reduxjs/toolkit";

import gameSlice from "./slices/game";
import gameDeployMiddleware from "./supplements/game-deploy-middleware";
import gameShootMiddleware from "./supplements/game-shoot-middleware";


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
    gameDeployMiddleware,
    gameShootMiddleware,
]);

// *** STORE ***

const store = configureStore({
    reducer: {
        game: gameSlice,
    },
    preloadedState,
    middleware,
    devTools: true,
})

export default store;
