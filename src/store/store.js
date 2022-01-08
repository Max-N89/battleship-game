import {configureStore} from "@reduxjs/toolkit";

import gameSliceReducer from "./slices/game";
import gameDeployMiddleware from "./supplements/game-deploy-middleware";
import gameShootMiddleware from "./supplements/game-shoot-middleware";

// *** preloaded state ***

const persistedGameString = localStorage.getItem("game");

let preloadedState;

if (persistedGameString) {
    preloadedState = {
        game: JSON.parse(persistedGameString),
    };
}

// *** middleware ***

const middleware = getDefaultMiddleware => ([
    ...getDefaultMiddleware(),
    gameDeployMiddleware,
    gameShootMiddleware,
]);

// *** store ***

const store = configureStore({
    reducer: {
        game: gameSliceReducer,
    },
    preloadedState,
    middleware,
    devTools: true,
})

export default store;
