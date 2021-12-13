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
            isGameOpen: false
        };

        this.gameOpenHandler = this.gameOpenHandler.bind(this);
        this.gameCloseHandler = this.gameCloseHandler.bind(this);
    }

    gameOpenHandler() {
        this.setState({
            isGameOpen: true
        });
    }

    gameCloseHandler() {
        this.setState({
            isGameOpen: false
        });
    }

    render() {
        const {isGameOpen} = this.state;

        return (
            <>
                <Header/>
                <GameMenu
                    isGameOpen={isGameOpen}
                    onGameOpen={this.gameOpenHandler}
                    onGameClose={this.gameCloseHandler}
                />
                <main>
                    {
                        isGameOpen ? <Game/> : <SplashScreen/>
                    }
                </main>
                <Footer/>
            </>
        );
    }
}

export default App;
