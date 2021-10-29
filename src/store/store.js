import {createStore} from "redux";

import rootReducer from "./reducers/root-reducer";

const persistedGameString = localStorage.getItem("game");

let preloadedState;

if (persistedGameString) {
    preloadedState = {
        game: JSON.parse(persistedGameString),
    };
}

const store = createStore(
    rootReducer,
    preloadedState,
    window.__REDUX_DEVTOOLS_EXTENSION__?.(),
);

export default store;
