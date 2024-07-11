import { useState, useEffect, useRef, useMemo } from "react"
import ChatMessage from "./msg"
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import "./chatbox.css"
import { decryptMessage } from "./utils/decrypt"

const ChatBox = (props) => {
    const [messages, setMessages] = useState([])
    const [formValue, setFormValue] = useState("")
    const scrollMarker = useRef()
    const fileInput = useRef()
    const messagesRef = useMemo(() => {
        return props.selectedChat
            ? collection(props.firestore, props.selectedChat)
            : null
    }, [props.selectedChat])

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
                console.log("new msgs", newMessages)
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

    const sendFileMessage = (e) => {
        const storage = getStorage()
        const filename = e.target.files[0].name
        const storageRef = ref(storage, filename)
        // 'file' comes from the Blob or File API
        uploadBytes(storageRef, e.target.files[0]).then((snapshot) => {
            console.log("Uploaded a blob or file!", snapshot)
            getDownloadURL(storageRef)
                .then((url) => {
                    console.log("File available at", url)
                    props.send(url, false, filename)
                    // Do something with the URL, e.g., display it or save it to a database
                })
                .catch((error) => {
                    console.error("Error getting download URL", error)
                })
        })
    }

    return (
        <main className="chat-box">
            <div className="msgs">
                {messages.map((msg, i) =>
                    i > 0 && messages[i - 1].uid !== msg.uid ? (
                        <ChatMessage
                            key={msg.id}
                            file={msg?.file}
                            filename={msg?.filename}
                            text={decryptMessage(msg.text)}
                            uid={msg.uid}
                            showProfileImg
                            isFile={msg.file ? true : false}
                        />
                    ) : (
                        <ChatMessage
                            key={msg.id}
                            text={decryptMessage(msg.text)}
                            uid={msg.uid}
                            file={msg?.file}
                            filename={msg?.filename}
                            showProfileImg={i === 0}
                            isFile={msg.file ? true : false}
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
                    onChange={sendFileMessage}
                />
                <div className="msg-box">
                    <input
                        value={formValue}
                        onChange={(e) => setFormValue(e.target.value)}
                        placeholder="Type a message"
                        className="msg-input"
                    />
                    <button
                        type="submit"
                        disabled={!formValue}
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
