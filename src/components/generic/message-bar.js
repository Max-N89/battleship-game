import React from "react";

function MessageBar(props) {
    const {message} = props;

    return (
        <p>
            {message}
        </p>
    );
}

export default MessageBar;
