import React from "react";
import ReactDOM from "react-dom";

import App from "./components/app";

import store from "./store/store";

const rootElement = document.createElement("div");

document.body.append(rootElement);

ReactDOM.render(
    <App/>,
    rootElement
);
