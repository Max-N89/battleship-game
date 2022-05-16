import React from "react";

import "./footer.css";

function Footer() {
    return (
        <footer>
            <section>
                <h2>About</h2>
                <p>
                    Pet-project of game web application
                    based on <a title="Page on Wikipedia about the battleship game" href="https://en.wikipedia.org/wiki/Battleship_(game)">the battleship game</a>
                    and built with <a title="Home page of a JavaScript library for building user interfaces" href="https://reactjs.org/">React</a> and related libraries.
                </p>
            </section>
            <section>
                <h2>Author</h2>
                <p>Created by Maksym Nikishyn.</p>
                <ul>
                    <li>
                        <a title="Project author email address" href="mailto:4work.maxn@gmail.com">4work.maxn@gmail.com</a>
                    </li>
                    <li>
                        <a title="Project author profile at GitHub" href="https://github.com/red-01ne">GitHub profile</a>
                    </li>
                </ul>
            </section>
            <section>
                <h2>Links</h2>
                <ul>
                    <li>
                        <a title="Homepage of the pet-project repository at GitHub" href="https://github.com/red-01ne/pp-battleship-game">Project Repository</a>
                    </li>
                </ul>
            </section>
        </footer>
    );
}

export default Footer;
