import React, {Component, Fragment} from "react";

import MessageBar from "../generic/message-bar";
import AuthForm from "../generic/auth-form";

import Background from "./background";
import DemoGame from "./demo-game";

export default class Home extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {onClickStartButton} = this.props;

        return (
            <main>
                {/*<Background/>*/}
                {/*<DemoGame/>*/}
                {/*<MessageBar/>*/}
                {/*<MessageBar/>*/}
                {/*<AuthForm/>*/}
                <button onClick={onClickStartButton}>START</button>
            </main>
        );
    }
};
