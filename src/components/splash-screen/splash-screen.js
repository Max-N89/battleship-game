import React from "react";

import BackgroundVideo from "./background-video";
import DemoGame from "./demo-game";
import MessageBar from "../generic/message-bar";

function SplashScreen(props) {
    const message = "Work in progress"

    return (
        <>
            {/*<BackgroundVideo/>*/}
            <DemoGame/>
            {/*<MessageBar message={message}/>*/}
            {/*<MessageBar message={message}/>*/}
        </>
    );
}

export default SplashScreen;
