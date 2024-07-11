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
                {!props.isFile ? (
                    <p className="msg-content">{props.text}</p>
                ) : (
                    <a className="msg-content" href={props.file} download target="_blank">
                        {props.filename}
                    </a>
                )}
            </div>
        </>
    )
}

export default ChatMessage
