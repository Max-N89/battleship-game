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
    }

    componentDidMount() {
        const {moveDelay} = this.state;
        const {makeMove, isGameOngoing, onGameReset, onGameContinue} = this.props;

        if (isGameOngoing) onGameReset();

        let persistedDemoGameSessionString = sessionStorage.getItem(DEMO_GAME_SESSION);

        if (persistedDemoGameSessionString) onGameContinue(JSON.parse(persistedDemoGameSessionString));

        this.moveTimerId = setInterval(makeMove, moveDelay);
    }

    componentWillUnmount() {
        const {game, isGameOngoing, onGameReset} = this.props;

        if (this.moveTimerId) {
            clearInterval(this.moveTimerId);
            this.moveTimerId = null;
        }

        if (isGameOngoing) {
            const persistedDemoGameSessionString = JSON.stringify(game);

            sessionStorage.setItem(DEMO_GAME_SESSION, persistedDemoGameSessionString);

            onGameReset();
        }
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
