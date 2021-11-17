import React from "react";
import ReactDOM from "react-dom";

import App from "./components/app";

const rootElement = document.createElement("div");

document.body.append(rootElement);

ReactDOM.render(
    <App/>,
    rootElement
);
