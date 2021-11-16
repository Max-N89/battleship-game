import React, {Component, Fragment} from "react";

import Home from "./home/home";
import Game from "./game/game";

export default class App extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Fragment>
                <Home/>
                <Game/>
            </Fragment>
        );
    }
};
