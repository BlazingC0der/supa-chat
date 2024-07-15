import "./msg.css"

const ChatMessage = (props) => {
    const messageClass =
        props.uid === sessionStorage.getItem("uid") ? "sent" : "received"
    let otherUserProfileImg
    let groupMembersUids
    let groupMembersNames
    let groupMembersProfileImgs
    if (props.groupChat) {
        groupMembersProfileImgs = JSON.parse(
            sessionStorage.getItem("other-user-photoURLs")
        )
        groupMembersNames = JSON.parse(
            sessionStorage.getItem("other-user-displayNames")
        )
        groupMembersUids = JSON.parse(sessionStorage.getItem("other-user-uids"))
        otherUserProfileImg = props.groupChat
            ? groupMembersProfileImgs[groupMembersUids.indexOf(props.uid)]
            : sessionStorage.getItem("other-user-photoURL")
    }

    return (
        <>
            <div className={`msg ${messageClass}`}>
                {props.showProfileImg ? (
                    <img
                        src={
                            messageClass === "sent"
                                ? sessionStorage.getItem("photoURL")
                                : otherUserProfileImg
                        }
                    />
                ) : (
                    <div style={{ height: "50px", width: "50px" }}></div>
                )}
                {!props.isFile ? (
                    <p className="msg-content">{props.text}</p>
                ) : (
                    <a
                        className="msg-content"
                        href={props.file}
                        download
                        target="_blank"
                    >
                        {props.filename}
                    </a>
                )}
            </div>
        </>
    )
}

export default ChatMessage
