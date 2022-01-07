import React from "react";

import "./footer.css";

function Footer() {
    return (
        <footer>
            <section>
                <h2>About</h2>
                <p>
                    A pet project of game web application
                    based on the <a title="Page on Wikipedia about the battleship game" href="https://en.wikipedia.org/wiki/Battleship_(game)">classic game</a> of the same name
                    built with <a title="Home page of a JavaScript library for building user interfaces" href="https://reactjs.org/">React</a> and related libraries.
                </p>
            </section>
            <section>
                <h2>Author</h2>
                <p>Created by Maksym Nikishyn.</p>
                <ul>
                    <li>
                        <a title="Project's author email address" href="mailto:4work.maxn@gmail.com">4work.maxn@gmail.com</a>
                    </li>
                    <li>
                        <a title="Project's author GitHub profile" href="https://github.com/Max-N89">GitHub profile</a>
                    </li>
                </ul>
            </section>
            <section>
                <h2>Links</h2>
                <ul>
                    <li>
                        <a title="Homepage of the battleship game project at GitHub" href="https://github.com/Max-N89/battleship-game">Project's Repository</a>
                    </li>
                </ul>
            </section>
        </footer>
    );
}

export default Footer;
