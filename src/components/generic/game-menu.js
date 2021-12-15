import React, {Component} from "react";

const PREV_GAME_SESSION = "prevGameSession";

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
        const prevGameSession = JSON.parse(localStorage.getItem(PREV_GAME_SESSION));

        onGameContinue(prevGameSession);
        onGameOpen();
    }

    onClickCloseButtonHandler() {
        const {game, isGameOngoing, onGameReset, onGameClose} = this.props;

        if (isGameOngoing) {
            const persistedPrevGameSessionString = JSON.stringify(game);

            localStorage.setItem(PREV_GAME_SESSION, persistedPrevGameSessionString);

            this.setState({
                isPrevGameSessionFinished: false
            });

            onGameReset();
        }

        onGameClose();
    }

    componentDidMount() {
        const persistedPrevGameSessionString = localStorage.getItem(PREV_GAME_SESSION);

        if (persistedPrevGameSessionString) {
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
