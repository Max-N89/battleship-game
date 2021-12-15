import React, {Component} from "react";
import {connect} from "react-redux";

import {gameAutoMove, gameReset, gameContinue} from "../../store/slices/game";

import {
    selectIsGameOngoing,
    selectPlayerGameGridMap,
    selectPlayersIds,
    selectGame,
} from "../../store/game-selectors";

import GameGrid from "../generic/game-grid";

const DEMO_GAME_SESSION = "demoGameSession";

class DemoGame extends Component {
    constructor(props) {
        super(props);

        this.state = {
            moveDelay: 2e3
        };

        this.moveTimerId = null;

        this.saveDemoGameSession = this.saveDemoGameSession.bind(this);
    }

    saveDemoGameSession() {
        const {game} = this.props;

        const persistedDemoGameSessionString = JSON.stringify(game);

        sessionStorage.setItem(DEMO_GAME_SESSION, persistedDemoGameSessionString);
    }

    componentDidMount() {
        const {moveDelay} = this.state;
        const {isGameOngoing, makeMove, onGameReset, onGameContinue} = this.props;

        let persistedDemoGameSessionString = sessionStorage.getItem(DEMO_GAME_SESSION);

        if (persistedDemoGameSessionString) {
            onGameContinue(JSON.parse(persistedDemoGameSessionString));
        } else if (isGameOngoing) {
            onGameReset();
        }

        this.moveTimerId = setInterval(makeMove, moveDelay);

        window.addEventListener("unload", this.saveDemoGameSession);
    }

    componentWillUnmount() {
        const {isGameOngoing, onGameReset} = this.props;

        if (this.moveTimerId) {
            clearInterval(this.moveTimerId);
            this.moveTimerId = null;
        }

        if (isGameOngoing) {
            this.saveDemoGameSession();
            onGameReset();
        }

        window.removeEventListener("unload", this.saveDemoGameSession);
    }

    render() {
        const {
            playerOneGameGridMap,
            playerTwoGameGridMap,
        } = this.props;

        return (
            <div>
                <GameGrid gridMap={playerOneGameGridMap}/>
                <GameGrid gridMap={playerTwoGameGridMap}/>
            </div>
        );
    }
}

export default connect(
    state => ({
        game: selectGame(state),
        isGameOngoing: selectIsGameOngoing(state),
        playerOneGameGridMap: selectPlayerGameGridMap(state, selectPlayersIds(state)[0]),
        playerTwoGameGridMap: selectPlayerGameGridMap(state, selectPlayersIds(state)[1]),
    }),
    {
        onGameReset: gameReset,
        makeMove: gameAutoMove,
        onGameContinue: gameContinue,
    }
)(DemoGame);
