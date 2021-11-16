import React, {Component} from "react";

import GameGrid from "../generic/game-grid";

export default class DemoGame extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <GameGrid/>
                <GameGrid/>
            </div>
        );
    }
};
