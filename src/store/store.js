import {createStore, applyMiddleware} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";

import rootReducer from "./reducers/root-reducer";
import gameShotActionMiddleware from "./middleware/game-shot-action-middleware";
import gameDeploymentActionMiddleware from "./middleware/game-deployment-action-middleware";

// *** PRELOADED STATE ***

const persistedGameString = localStorage.getItem("game");

let preloadedState;

if (persistedGameString) {
    preloadedState = {
        game: JSON.parse(persistedGameString),
    };
}

// *** MIDDLEWARE ***

const middleware = [gameDeploymentActionMiddleware, gameShotActionMiddleware];
const middlewareEnhancer = applyMiddleware(...middleware);
const composedEnhancer = composeWithDevTools(middlewareEnhancer);

// *** STORE ***

const store = createStore(
    rootReducer,
    preloadedState,
    composedEnhancer,
);

export default store;
