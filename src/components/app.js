import React, {Component} from "react";

import Header from "./generic/header";
import Footer from "./generic/footer";
import GameMenu from "./generic/game-menu";
import SplashScreen from "./splash-screen/splash-screen";
import Game from "./game/game";

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isGameOpen: false,
            isGameNew: false,
        };

        this.gameStartNewHandler = this.gameStartNewHandler.bind(this);
        this.gameContinuePrevHandler = this.gameContinuePrevHandler.bind(this);
        this.gameCloseCurrentHandler = this.gameCloseCurrentHandler.bind(this);
    }

    gameStartNewHandler() {
        this.setState({
            isGameOpen: true,
            isGameNew: true,
        });
    }

    gameContinuePrevHandler() {
        this.setState({
            isGameOpen: true,
            isGameNew: false,
        });
    }

    gameCloseCurrentHandler() {
        this.setState({
            isGameOpen: false,
        });
    }

    render() {
        const {isGameOpen, isGameNew} = this.state;
        const {gameStartNewHandler, gameContinuePrevHandler, gameCloseCurrentHandler} = this;

        return (
            <>
                <Header/>
                <GameMenu
                    isGameOpen={isGameOpen}
                    onGameStartNew={gameStartNewHandler}
                    onGameContinuePrev={gameContinuePrevHandler}
                    onGameCloseCurrent={gameCloseCurrentHandler}
                />
                <main>
                    {
                        isGameOpen ? <Game isNew={isGameNew}/> : <SplashScreen/>
                    }
                </main>
                <Footer/>
            </>
        );
    }
}

export default App;
