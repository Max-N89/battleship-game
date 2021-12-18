import React, {Component} from "react";
import {connect} from "react-redux";

import {gameAutoMove, gameReset, gameContinue} from "../../store/slices/game";

import {
    selectCurrentSession,
    selectPlayerGameGridMap,
    selectPlayersIds,
} from "../../store/game-selectors";

import GameGrid from "../generic/game-grid";

const DEMO_GAME_SESSION = "demoGameSession";

class DemoGame extends Component {
    constructor(props) {
        super(props);

        this.state = {
            moveDelay: 2e2
        };

        this.moveTimerId = null;

        this.saveDemoGameSession = this.saveDemoGameSession.bind(this);
        this.makeDemoGameMove = this.makeDemoGameMove.bind(this);
    }

    saveDemoGameSession() {
        const {gameSession} = this.props;

        const persistedDemoGameSessionString = JSON.stringify(gameSession);

        sessionStorage.setItem(DEMO_GAME_SESSION, persistedDemoGameSessionString);
    }

    makeDemoGameMove() {
        const {gameErrors, onGameMove, onGameReset} = this.props;

        if (gameErrors.length) {
            onGameReset();
        } else {
            onGameMove();
        }
    }

    componentDidMount() {
        const {moveDelay} = this.state;
        const {onGameReset, onGameContinue} = this.props;
        const {makeDemoGameMove} = this;

        let persistedDemoGameSessionString = sessionStorage.getItem(DEMO_GAME_SESSION);

        if (persistedDemoGameSessionString) {
            onGameContinue(persistedDemoGameSessionString);
        } else {
            onGameReset();
        }

        this.moveTimerId = setInterval(makeDemoGameMove, moveDelay);

        window.addEventListener("unload", this.saveDemoGameSession);
    }

    componentWillUnmount() {
        if (this.moveTimerId) {
            clearInterval(this.moveTimerId);
            this.moveTimerId = null;
        }

        this.saveDemoGameSession();

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
        gameSession: selectCurrentSession(state),
        playerOneGameGridMap: selectPlayerGameGridMap(state, selectPlayersIds(state)[0]),
        playerTwoGameGridMap: selectPlayerGameGridMap(state, selectPlayersIds(state)[1]),
    }),
    {
        onGameReset: gameReset,
        makeMove: gameAutoMove,
        onGameContinue: gameContinue,
    }
)(DemoGame);
