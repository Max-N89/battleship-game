import React, {Component} from "react";
import {connect} from "react-redux";

import {gameContinue, gameReset} from "../../store/slices/game";
import {selectIsGameOngoing, selectPlayers} from "../../store/game-selectors";

const PREV_GAME_SESSION_PLAYERS = "prevGameSessionPlayers";

class GameMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isPrevGameSessionFinished: true,
        };

        this.onClickStartButtonHandler = this.onClickStartButtonHandler.bind(this);
        this.onClickContinueButtonHandler = this.onClickContinueButtonHandler.bind(this);
        this.onClickCloseButtonHandler = this.onClickCloseButtonHandler.bind(this);
    }

    onClickStartButtonHandler() {
        const {isGameOngoing, onGameReset, onGameOpen} = this.props;

        if (isGameOngoing) onGameReset();

        onGameOpen();
    }

    onClickContinueButtonHandler() {
        const {onGameContinue, onGameOpen} = this.props;
        const prevGameSessionPlayers = JSON.parse(localStorage.getItem(PREV_GAME_SESSION_PLAYERS));

        onGameContinue(prevGameSessionPlayers);
        onGameOpen();
    }

    onClickCloseButtonHandler() {
        const {players, isGameOngoing, onGameReset, onGameClose} = this.props;

        if (isGameOngoing) {
            const persistedPrevGameSessionPlayersString = JSON.stringify(players);

            localStorage.setItem(PREV_GAME_SESSION_PLAYERS, persistedPrevGameSessionPlayersString);

            this.setState({
                isPrevGameSessionFinished: false
            });

            onGameReset();
        }

        onGameClose();
    }

    componentDidMount() {
        const persistedPrevGameSessionPlayersString = localStorage.getItem(PREV_GAME_SESSION_PLAYERS);

        if (persistedPrevGameSessionPlayersString) {
            this.setState({
                isPrevGameSessionFinished: false
            });
        }
    }

    render() {
        const {isGameOpen} = this.props;
        const {isPrevGameSessionFinished} = this.state;

        const {
            onClickStartButtonHandler,
            onClickContinueButtonHandler,
            onClickCloseButtonHandler,
        } = this;

        return (
            <section>
                <h2>Game Menu</h2>
                <button onClick={onClickStartButtonHandler}>Start New</button>
                {
                    !isGameOpen &&
                    !isPrevGameSessionFinished &&
                    <button onClick={onClickContinueButtonHandler}>Continue Last</button>
                }
                {
                    isGameOpen &&
                    <button onClick={onClickCloseButtonHandler}>Close Current</button>
                }
            </section>
        );
    }
}

export default connect(
    state => ({
        isGameOngoing: selectIsGameOngoing(state),
        players: selectPlayers(state),
    }),
    {
        onGameContinue: gameContinue,
        onGameReset: gameReset,
    }
)(GameMenu);
