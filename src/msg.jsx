import "./msg.css"
import doc from "./assets/doc.jpg"

const ChatMessage = (props) => {
    const messageClass =
        props.uid === sessionStorage.getItem("uid") ? "sent" : "received"
    let otherUserProfileImg
    let otherUserDisplayName
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
        otherUserDisplayName = props.groupChat
            ? groupMembersNames[groupMembersUids.indexOf(props.uid)]
            : sessionStorage.getItem("other-user-displayName")
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
                        className="user-profile-img"
                    />
                ) : (
                    <div style={{ height: "50px", width: "50px" }}></div>
                )}
                {!props.isFile ? (
                    <p className="msg-content">
                        {props.showProfileImg && (
                            <>
                                <span
                                    style={{
                                        fontWeight: "bold",
                                        fontSize: "10px"
                                    }}
                                >
                                    {messageClass === "sent"
                                        ? sessionStorage.getItem("displayName")
                                        : otherUserDisplayName}
                                </span>
                                <br />
                            </>
                        )}
                        {props.text}
                    </p>
                ) : props.fileType.includes("application") ? (
                    <a
                        className="msg-content file-link"
                        href={props.file}
                        download
                        target="_blank"
                    >
                        <div className="file-msg">
                            <img
                                src={doc}
                                alt="file icon"
                                className="file-icon"
                            />
                            <div className="file-info">
                                <span className="file-name">
                                    {props.filename}
                                </span>
                                <span className="file-size">
                                    {props.fileSize}
                                </span>
                            </div>
                        </div>
                    </a>
                ) : props.fileType.includes("video") ? (
                    <video
                        src={props.file}
                        className="msg-visual"
                        style={{
                            border:
                                messageClass === "sent"
                                    ? "3px solid #000080"
                                    : "3px solid #f1f1f1"
                        }}
                        controls
                    />
                ) : (
                    <img
                        src={props.file}
                        className="msg-visual"
                        style={{
                            border:
                                messageClass === "sent"
                                    ? "3px solid #000080"
                                    : "3px solid #f1f1f1"
                        }}
                    />
                )}
            </div>
        </>
    )
}

export default ChatMessage
