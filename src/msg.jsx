import "./msg.css"
import doc from "./assets/doc.jpg"
import { CircularProgress, styled } from "@mui/material"

const ChatMessage = (props) => {
    const messageClass =
        props.uid === sessionStorage.getItem("uid") || props.loading
            ? "sent"
            : "received"
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
    }
    if (props.showProfileImg) {
        otherUserProfileImg = props.groupChat
            ? groupMembersProfileImgs[groupMembersUids.indexOf(props.uid)]
            : sessionStorage.getItem("other-user-photoURL")
        otherUserDisplayName = props.groupChat
            ? groupMembersNames[groupMembersUids.indexOf(props.uid)]
            : sessionStorage.getItem("other-user-displayName")
    }

    const ImgLoader = styled(CircularProgress)({ color: "white" })
    const FileLoader = styled(CircularProgress)({ color: "rgb(0, 0, 128)" })

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
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        order: messageClass === "sent" ? -1 : 1
                    }}
                >
                    {props.showProfileImg && window.innerWidth <= 850 && (
                        <>
                            <span
                                style={{
                                    fontWeight: 600,
                                    fontSize: "12px",
                                    textAlign:
                                        messageClass === "sent"
                                            ? "right"
                                            : "left"
                                }}
                            >
                                {messageClass === "sent"
                                    ? "You"
                                    : otherUserDisplayName}
                            </span>
                            <br />
                        </>
                    )}
                    {!props.isFile ? (
                        <p className="msg-content">
                            {props.showProfileImg &&
                                window.innerWidth > 850 && (
                                    <>
                                        <span
                                            style={{
                                                fontWeight: "bold",
                                                fontSize: "10px"
                                            }}
                                        >
                                            {messageClass === "sent"
                                                ? "You"
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
                            href={props.loading ? "#" : props.file}
                            download
                            target="_blank"
                        >
                            <div className="file-msg">
                                {props.loading ? (
                                    <FileLoader />
                                ) : (
                                    <img
                                        src={doc}
                                        alt="file icon"
                                        className="file-icon"
                                    />
                                )}
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
                    ) : props.loading ? (
                        <div
                            className="msg-visual"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center"
                            }}
                        >
                            <ImgLoader />
                        </div>
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
            </div>
        </>
    )
}

export default ChatMessage
