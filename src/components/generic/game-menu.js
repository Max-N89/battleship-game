import React from "react";

function GameMenu(props) {
    const {isGameOpen, canContinePrev, onGameStartNew, onGameContinuePrev, onGameCloseCurrent} = props;

    return (
        <section>
            <h2>Game Menu</h2>
            <button onClick={onGameStartNew}>Start New</button>
            {
                !isGameOpen &&
                canContinePrev &&
                <button onClick={onGameContinuePrev}>Continue Previous</button>
            }
            {
                isGameOpen &&
                <button onClick={onGameCloseCurrent}>Close Current</button>
            }
        </section>
    );
}

export default GameMenu;
