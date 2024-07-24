import { useState } from "react"
import "./chat-header.css"

const ChatHeader = (props) => {
    const [showMsgMenu, setShowMsgMenu] = useState(false)

    return (
        <header>
            <div className="msg-controls">
                <h4>Messages</h4>
                <button
                    className="grouping-btn"
                    onClick={() => setShowMsgMenu((show) => !show)}
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
                {showMsgMenu && (
                    <div className="msg-menu">
                        <div
                            className="chat-option"
                            onClick={() => setShowMsgMenu(false)}
                        >
                            <span class="material-symbols-outlined">
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
                            <span class="material-symbols-outlined">
                                group_add
                            </span>
                            New Group
                        </div>
                    </div>
                )}
            </div>
            <div className="chat-info">
                {props.chatName && (
                    <div className="chat-title">
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
            <div className="chat-dir"><h4>Directory</h4></div>
        </header>
    )
}

export default ChatHeader
