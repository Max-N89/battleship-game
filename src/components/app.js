import React, {Component, Fragment} from "react";

import Header from "./generic/header";
import Footer from "./generic/footer";

import Home from "./home/home";
import Game from "./game/game";

import {GAME_STATUSES} from "./constants";

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            gameStatus: GAME_STATUSES.IDLE
        };

        this.handleStartClick = this.handleStartClick.bind(this);
    }

    handleStartClick() {
        this.setState({
            gameStatus: GAME_STATUSES.IN_PROGRESS
        });
    }

    render() {
        return (
            <Fragment>
                <Header/>
                {
                    this.state.gameStatus === GAME_STATUSES.IDLE ?
                        <Home onStartClick={this.handleStartClick}/> :
                        <Game/>
                }
                <Footer/>
            </Fragment>
        );
    }
};
