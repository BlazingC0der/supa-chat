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
import QtyHeading from "./qty-heading"
import MemberList from "./chat-list"
import FileList from "./file-list"

const ChatBox = (props) => {
    const [messages, setMessages] = useState([])
    const [formValue, setFormValue] = useState("")
    const [files, setFiles] = useState([])
    const [fileUploads, setFileUploads] = useState([])
    const scrollMarker = useRef()
    const fileInput = useRef()

    const messagesRef = useMemo(() => {
        setFiles([])
        setFileUploads([])
        return props.selectedChat
            ? collection(props.firestore, props.selectedChat.uid)
            : null
    }, [props.selectedChat])

    useEffect(() => {
        if (messagesRef) {
            const messageQuery = query(
                messagesRef,
                orderBy("createdAt","desc"),
                limit(25)
            )
            const unsubscribe = onSnapshot(messageQuery, (querySnapshot) => {
                const tempFiles = [...files]
                const newMessages = querySnapshot.docs.map((doc) => {
                    const msgData = doc.data()
                    if (msgData.file) {
                        tempFiles.unshift({ id: doc.id, ...msgData })
                    }
                    return {
                        id: doc.id,
                        ...msgData
                    }
                }).reverse()
                setFiles([...tempFiles])
                console.log("new msgs", newMessages)
                setMessages([...newMessages])
            })
            return unsubscribe
        }
    }, [messagesRef])

    useEffect(() => {
        scrollMarker.current.scrollIntoView({ behavior: "smooth" })
    }, [messages,fileUploads])

    const sendMessage = async (e) => {
        e.preventDefault()
        const msgContent = formValue
        setFormValue("")
        try {
            await props.send(msgContent, props.selectedChat.type === "group")
        } catch (error) {
            console.error(error)
        }
    }

    const formatFileSize = (bytes) => {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
        if (bytes === 0) return "0 Byte"
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
        return `${Math.round(bytes / Math.pow(1024, i), 2)}${sizes[i]}`
    }

    const sendFileMessage = (e) => {
        const storage = getStorage()
        const filename = e.target.files[0].name
        console.log("file", e.target.files[0])
        const size = formatFileSize(e.target.files[0].size)
        const type = e.target.files[0].type
        setFileUploads([...fileUploads, { filename, size, type }])
        const storageRef = ref(
            storage,
            `files/${props.selectedChat.uid}/${filename}`
        )
        // 'file' comes from the Blob or File API
        uploadBytes(storageRef, e.target.files[0])
            .then((snapshot) => {
                console.log("Uploaded a blob or file!", snapshot)
                setFileUploads((files) => {
                    return files.filter((file) => file.filename !== filename)
                })
                getDownloadURL(storageRef)
                    .then((url) => {
                        console.log("File available at", url)
                        props.send(
                            url,
                            props.selectedChat.type === "group",
                            false,
                            filename,
                            size,
                            type
                        )
                        // Do something with the URL
                    })
                    .catch((error) => {
                        console.error("Error getting download URL", error)
                    })
            })
            .catch((error) => {
                console.error("Error uploading file", error)
            })
    }

    return (
        <main className="chat-box">
            <div className="chat-area">
                <div className="msgs">
                    {props.selectedChat &&
                        messages.map((msg, i) =>
                            i > 0 && messages[i - 1].uid !== msg.uid ? (
                                <ChatMessage
                                    key={msg.id}
                                    file={msg?.file}
                                    filename={decryptMessage(msg.filename)}
                                    fileSize={msg.size}
                                    fileType={msg.type}
                                    text={decryptMessage(msg.text)}
                                    uid={msg.uid}
                                    showProfileImg
                                    isFile={msg.file ? true : false}
                                    groupChat={
                                        props.selectedChat.type === "group"
                                    }
                                />
                            ) : (
                                <ChatMessage
                                    key={msg.id}
                                    text={decryptMessage(msg.text)}
                                    uid={msg.uid}
                                    file={msg?.file}
                                    filename={decryptMessage(msg.filename)}
                                    showProfileImg={i === 0}
                                    isFile={msg.file ? true : false}
                                    groupChat={
                                        props.selectedChat.type === "group"
                                    }
                                    fileSize={msg.size}
                                    fileType={msg.type}
                                />
                            )
                        )}
                    {fileUploads.map((file) => (
                        <ChatMessage
                            key={file.filename}
                            filename={file.filename}
                            fileSize={file.size}
                            fileType={file.type}
                            isFile
                            loading
                        />
                    ))}
                    <span ref={scrollMarker}></span>
                </div>
                <form onSubmit={sendMessage} className="msg-form">
                    <button
                        className="attach-btn"
                        onClick={() => fileInput.current.click()}
                        type="button"
                    >
                        <span className="material-symbols-rounded">
                            attach_file
                        </span>
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
                            <span className="material-symbols-rounded">
                                send
                            </span>
                        </button>
                    </div>
                </form>
            </div>
            <div className="chat-directory">
                {props.selectedChat?.type === "group" && (
                    <div className="members-dir">
                        <QtyHeading
                            headingText="Group Members"
                            qty={props.selectedChat?.members?.length}
                        />
                        <MemberList users={props.selectedChat?.members} />
                    </div>
                )}
                <div
                    className="files-dir"
                    style={{
                        height:
                            props.selectedChat?.type === "group"
                                ? "40%"
                                : "100%"
                    }}
                >
                    <QtyHeading headingText="Files" qty={files?.length} />
                    <FileList files={files} />
                </div>
            </div>
        </main>
    )
}

export default ChatBox
