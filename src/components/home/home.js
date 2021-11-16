import React, {Component, Fragment} from "react";

import Header from "../generic/header";
import Footer from "../generic/footer";
import MessageBar from "../generic/message-bar";

import Background from "./background";
import DemoGame from "./demo-game";


export default class Home extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Fragment>
                <Header/>
                <main>
                    <Background/>
                    <DemoGame/>
                    <MessageBar/>
                    <MessageBar/>
                    <button>START</button>
                </main>
                <Footer/>
            </Fragment>
        );
    }
};
