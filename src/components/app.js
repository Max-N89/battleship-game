import React, {Component, Fragment} from "react";

import Header from "./generic/header";
import Footer from "./generic/footer";

import Home from "./home/home";
import Game from "./game/game";

import {GAME_STATUSES} from "../constants";

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            gameStatus: GAME_STATUSES.IDLE
        };

        this.onClickStartButtonHandler = this.onClickStartButtonHandler.bind(this);
    }

    onClickStartButtonHandler() {
        this.setState({
            gameStatus: GAME_STATUSES.IN_PROGRESS
        });
    }

    render() {
        const {gameStatus} = this.state;

        return (
            <Fragment>
                <Header/>
                {
                    gameStatus === GAME_STATUSES.IDLE ?
                        <Home onClickStartButton={this.onClickStartButtonHandler}/> :
                        <Game/>
                }
                <Footer/>
            </Fragment>
        );
    }
};
