import React from "react";
import {connect} from "react-redux";

import {selectPrevSavedSession} from "../../store/game-selectors";

import "./game-menu.css"

function GameMenu(props) {
    const {isGameOpen, canContinuePrev, onGameStartNew, onGameContinuePrev, onGameCloseCurrent} = props;

    return (
        <div className="game-menu-wrapper">
            <section className="game-menu">
                <h2>Game Menu</h2>
                <button onClick={onGameStartNew}>Start New</button>
                {
                    !isGameOpen &&
                    canContinuePrev &&
                    <button onClick={onGameContinuePrev}>Continue Previous</button>
                }
                {
                    isGameOpen &&
                    <button onClick={onGameCloseCurrent}>Close Current</button>
                }
            </section>
        </div>
    );
}

export default connect(
    state => ({
        canContinuePrev: Boolean(selectPrevSavedSession(state)),
    })
)(GameMenu);
