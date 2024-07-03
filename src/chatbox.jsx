import { useState, useEffect, useRef, useMemo } from "react"
import ChatMessage from "./msg"
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore"
import "./chatbox.css"

const ChatBox = (props) => {
    const [messages, setMessages] = useState([])
    const msgText = useRef()
    const scrollMarker = useRef()
    const fileInput = useRef()
    const messagesRef = useMemo(
        () =>
            props.selectedChat
                ? collection(props.firestore, props.selectedChat)
                : null,
        [props.selectedChat]
    )

    useEffect(() => {
        console.log("new user", props.auth)
        scrollMarker.current.scrollIntoView({ behavior: "smooth" })
    }, [props.auth])

    useEffect(() => {
        if (messagesRef) {
            const messageQuery = query(
                messagesRef,
                orderBy("createdAt"),
                limit(25)
            )
            const unsubscribe = onSnapshot(messageQuery, (querySnapshot) => {
                const newMessages = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }))
                console.log("new", newMessages)
                setMessages(newMessages)
            })
            return unsubscribe
        }
    }, [messagesRef])

    const sendMessage = async (e) => {
        e.preventDefault()
        try {
            await props.send(msgText.current)
            msgText.current.value = ""
            scrollMarker.current.scrollIntoView({ behavior: "smooth" })
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <main className="chat-box">
            <div className="msgs">
                {messages.map((msg, i) =>
                    i > 0 && messages[i - 1].uid !== msg.uid ? (
                        <ChatMessage
                            key={msg.id}
                            text={msg.text}
                            uid={msg.uid}
                            photoURL={msg.photoURL}
                        />
                    ) : (
                        <ChatMessage
                            key={msg.id}
                            text={msg.text}
                            uid={msg.uid}
                            photoURL={i === 0 ? msg.photoURL : ""}
                        />
                    )
                )}
                <span ref={scrollMarker}></span>
            </div>
            <form onSubmit={sendMessage} className="msg-form">
                <button
                    className="attach-btn"
                    onClick={() => fileInput.current.click()}
                    type="button"
                >
                    <span class="material-symbols-rounded">attach_file</span>
                </button>
                <input
                    type="file"
                    name="file-msg"
                    id="file-msg"
                    style={{ display: "none" }}
                    ref={fileInput}
                    onChange={(e) => console.log("file", e.target.files[0])}
                />
                <div className="msg-box">
                    <input
                        value={msgText.current}
                        onChange={(e) => (msgText.current = e.target.value)}
                        placeholder="Type a message"
                        className="msg-input"
                    />
                    <button
                        type="submit"
                        disabled={!msgText.current}
                        className="msg-send-btn"
                    >
                        <span className="material-symbols-rounded">send</span>
                    </button>
                </div>
            </form>
        </main>
    )
}

export default ChatBox
