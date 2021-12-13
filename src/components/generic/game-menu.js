import React, {Component} from "react";

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
        this.props.onGameReset();
        this.props.onGameOpen();
    }

    onClickContinueButtonHandler() {
        const prevGameSessionPlayers = JSON.parse(localStorage.getItem(PREV_GAME_SESSION_PLAYERS));

        this.props.onGameContinue(prevGameSessionPlayers);
        this.props.onGameOpen();
    }

    onClickCloseButtonHandler() {
        if (
            Object.values(this.props.players).some(playerEntity => playerEntity.deploymentHistory.length)
        ) {
            const persistedPrevGameSessionPlayersString = JSON.stringify(this.props.players);

            localStorage.setItem(PREV_GAME_SESSION_PLAYERS, persistedPrevGameSessionPlayersString);

            this.setState({
                isPrevGameSessionFinished: false
            });
        }

        this.props.onGameReset();
        this.props.onGameClose();
    }

    componentDidMount() {
        const persistedPrevGameSessionPlayersString = localStorage.getItem(PREV_GAME_SESSION_PLAYERS);

        let prevGameSessionPlayers;

        if (persistedPrevGameSessionPlayersString) {
            prevGameSessionPlayers = JSON.parse(persistedPrevGameSessionPlayersString);
        }

        if (
            prevGameSessionPlayers &&
            Object.values(prevGameSessionPlayers).some(playerEntity => playerEntity.deploymentHistory.length)
        ) {
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

export default GameMenu;
