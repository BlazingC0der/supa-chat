import { useState, useEffect, useRef, useMemo } from "react"
import ChatMessage from "./msg"
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    serverTimestamp
} from "firebase/firestore"
import "./chatbox.css"

const ChatBox = (props) => {
    const [messages, setMessages] = useState([])
    const msgText = useRef()
    const scrollMarker = useRef()
    const messagesRef = useMemo(
        () => collection(props.firestore, "messages"),
        [props.firestore]
    )

    useEffect(() => {
        console.log("new user", props.auth);
        scrollMarker.current.scrollIntoView({ behavior: "smooth" })
    }, [props.auth])


    useEffect(() => {
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
    }, [messagesRef])

    const sendMessage = async (e) => {
        e.preventDefault()

        const { uid, displayName, photoURL } = props.auth.currentUser
        await addDoc(messagesRef, {
            text: msgText.current,
            createdAt: serverTimestamp(),
            uid,
            displayName,
            photoURL
        })
        msgText.current=""
        scrollMarker.current.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <>
            <main className="chats">
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
            </main>
            <form onSubmit={sendMessage} className="msg-form">
                <input
                    value={msgText.current}
                    onChange={(e) => msgText.current = e.target.value}
                    placeholder="Type a message"
                    className="msg-input"
                />
                <input type="submit" disabled={!msgText.current} value={"Send"} className="msg-submit"/>
            </form>
        </>
    )
}

export default ChatBox
