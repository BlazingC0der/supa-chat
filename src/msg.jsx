import "./msg.css"

const ChatMessage = (props) => {
    const messageClass =
        props.uid === sessionStorage.getItem("uid") ? "sent" : "received"

    return (
        <>
            <div className={`msg ${messageClass}`}>
                {props.showProfileImg ? (
                    <img
                        src={
                            messageClass === "sent"
                                ? sessionStorage.getItem("photoURL")
                                : sessionStorage.getItem("other-user-photoURL")
                        }
                    />
                ) : (
                    <div style={{ height: "50px", width: "50px" }}></div>
                )}
                <p className="msg-text">{props.text}</p>
            </div>
        </>
    )
}

export default ChatMessage
