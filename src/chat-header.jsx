import { useState } from "react"
import "./chat-header.css"

const ChatHeader = (props) => {
    const [showMsgMenu, setShowMsgMenu] = useState(false)

    const showGroupInfoOnPhone = () => {
        if (window.innerWidth <= 850) {
            document.querySelector(".chat-directory").style.display = "block"
            document.querySelector(".chat-area").style.display = "none"
        }
    }

    const switchScreenOnPhone = (e) => {
        e.stopPropagation()
        if (window.innerWidth <= 850) {
            const chatDirRef = document.querySelector(".chat-directory")
            const chatAreaRef = document.querySelector(".chat-area")
            if (chatDirRef.style.display === "block") {
                chatDirRef.style.display = "none"
                chatAreaRef.style.display = "flex"
            } else {
                document.querySelector(".chat-box").style.display = "none"
                document.querySelector(".chat-list").style.display = "flex"
                document.querySelector(".msg-controls").style.display = "flex"
                document.querySelector(".chat-info").style.display = "none"
                console.log(chatDirRef.style.display)
            }
        }
    }

    return (
        <header>
            <div className="msg-controls">
                <h4>Messages</h4>
                {window.innerWidth > 850 && (
                    <button
                        className="grouping-btn"
                        onClick={() => setShowMsgMenu((show) => !show)}
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                )}
                {showMsgMenu && (
                    <div className="msg-menu">
                        <div
                            className="chat-option"
                            onClick={() => setShowMsgMenu(false)}
                        >
                            <span className="material-symbols-outlined">
                                person_add
                            </span>
                            New Chat
                        </div>
                        <div
                            className="chat-option"
                            onClick={() => {
                                props.openGroupModal()
                                setShowMsgMenu(false)
                            }}
                        >
                            <span className="material-symbols-outlined">
                                group_add
                            </span>
                            New Group
                        </div>
                    </div>
                )}
            </div>
            <div className="chat-info">
                {props.chatName && (
                    <div className="chat-title" onClick={showGroupInfoOnPhone}>
                        {window.innerWidth <= 850 && (
                            <button
                                className="back-btn"
                                onClick={switchScreenOnPhone}
                            >
                                <span className="material-symbols-outlined">
                                    arrow_back
                                </span>
                            </button>
                        )}
                        <img
                            className="chat-icon"
                            src={props.chatImg}
                            alt="chat icon"
                        />
                        <h4 className="chat-name">{props.chatName}</h4>
                    </div>
                )}
                <button className="sign-out" onClick={props.signOut}>
                    Sign Out
                </button>
            </div>
            <div className="chat-dir">
                <h4>Directory</h4>
            </div>
        </header>
    )
}

export default ChatHeader
