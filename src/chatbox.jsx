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
    const [formValue, setFormValue] = useState("")
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
            text: formValue,
            createdAt: serverTimestamp(),
            uid,
            displayName,
            photoURL
        })
        setFormValue("")
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
            <form onSubmit={sendMessage}>
                <input
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="Type a message"
                />
                <input type="submit" disabled={!formValue} value={"Send"} />
            </form>
        </>
    )
}

export default ChatBox
