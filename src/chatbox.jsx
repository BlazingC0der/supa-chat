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
    const [formValue, setFormValue] = useState("")
    const scrollMarker = useRef()
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
            const messageQuery = query(messagesRef, orderBy("createdAt"), limit(25))
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
            await props.send(formValue)
            setFormValue("")
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
            <form onSubmit={sendMessage}>
                <input
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="Type a message"
                />
                <button type="submit" disabled={!formValue}>
                    <span class="material-symbols-rounded">send</span>
                </button>
            </form>
        </main>
    )
}

export default ChatBox
