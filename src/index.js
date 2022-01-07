import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "react-redux";

import App from "./components/app";
import store from "./store/store";

import "normalize.css";
import "./basic.css";

const rootElement = document.createElement("div");

rootElement.classList.add("app");

document.body.append(rootElement);

ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    rootElement
);
