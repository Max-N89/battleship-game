import React, {Component, Fragment} from "react";

import Header from "../generic/header";
import Footer from "../generic/footer";
import GameGrid from "../generic/game-grid";

import ScoreBar from "./score-bar";
import DeploymentMenu from "./deployment-menu";
import GameMenu from "./game-menu";

export default class Game extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Fragment>
                <Header/>
                <main>
                    <ScoreBar/>
                    <ScoreBar/>
                    <GameGrid/>
                    <DeploymentMenu/>
                    <GameGrid/>
                    <GameMenu/>
                </main>
                <Footer/>
            </Fragment>
        );
    }
};
