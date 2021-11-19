import React, {Component, Fragment} from "react";

import MessageBar from "../generic/message-bar";
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
                <DemoGame/>
                {/*<MessageBar/>*/}
                {/*<MessageBar/>*/}
                <button onClick={onClickStartButton}>START</button>
            </main>
        );
    }
};
