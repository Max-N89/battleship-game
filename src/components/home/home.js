import React, {Component, Fragment} from "react";

import MessageBar from "../generic/message-bar";
import AuthForm from "../generic/auth-form";

import BackgroundVideo from "./background-video";
import DemoGame from "./demo-game";

export default class Home extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {onClickStartButton} = this.props;

        return (
            <main>
                {/*<BackgroundVideo/>*/}
                <DemoGame/>
                {/*<MessageBar/>*/}
                {/*<MessageBar/>*/}
                {/*<AuthForm/>*/}
                <button onClick={onClickStartButton}>START</button>
            </main>
        );
    }
};
