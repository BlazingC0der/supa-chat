import { useEffect, useMemo, useRef, useState, useContext } from "react"
import "./chat-list.css"
import sha1 from "sha1"
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    getDoc,
    doc
} from "firebase/firestore"
import Searchbar from "./searchbar"
import { decryptMessage } from "./utils/decrypt"
import groupProfileImg from "./assets/group.png"

const ChatList = (props) => {
    const selectedChat = useRef(null)
    const [chats, setChats] = useState([])
    const [searchedUsers, setSearchedUsers] = useState([])
    const [groupCreationMode, setGroupCreationMode] = useState(false)
    const [groupMembers, setGroupMembers] = useState([])
    const [latestMsgs, setLatestMsgs] = useState([])

    useEffect(() => {
        ;(async () => {
            if (!groupCreationMode) {
                groupMembers.length &&
                    (await props.createGroup([...groupMembers]))
                setGroupMembers([])
            }
        })()
    }, [groupCreationMode])

    const conversations = useMemo(() => {
        return searchedUsers.length ? searchedUsers : chats
    }, [searchedUsers, chats])

    const msgRefs = useMemo(
        () =>
            conversations.map((user) =>
                collection(
                    props.firestore,
                    sha1(user.uid + sessionStorage.getItem("uid"))
                )
            ),
        [conversations]
    )

    useEffect(() => {
        if (msgRefs.length > 0) {
            const unsubscribers = msgRefs.map((ref, i) => {
                const messageQuery = query(
                    ref,
                    orderBy("createdAt", "desc"),
                    limit(1)
                )
                return onSnapshot(messageQuery, (querySnapshot) => {
                    setLatestMsgs((prevLatestMsgs) => {
                        const newLatestMsgs = [...prevLatestMsgs]
                        const latestMsg = querySnapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data()
                        }))
                        console.log("latestMsg", latestMsg);
                        newLatestMsgs[i] = latestMsg[0]?.text
                            ? latestMsg[0]?.text
                            : latestMsg[0]?.filename
                        return newLatestMsgs
                    })
                })
            })
            // Clean up the onSnapshot listeners on unmount
            return () => {
                unsubscribers.forEach((unsubscribe) => unsubscribe())
            }
        }
    }, [msgRefs])

    useEffect(() => {
        const fetchChatParticipants = async (chatUids) => {
            const tempUsers = await Promise.all(
                chatUids.map(async (uid) => {
                    try {
                        const chatRef = collection(props.firestore, uid)
                        const participantsSnap = await getDoc(
                            doc(chatRef, "participants")
                        )
                        if (participantsSnap.exists()) {
                            const participants =
                                participantsSnap.data().userData
                            let userData
                            if (participants.length > 2) {
                                const uids = participants.map(
                                    (participant) => participant.uid
                                )
                                const displayNames = participants.map(
                                    (participant) => participant.name
                                )
                                const photoURLs = participants.map(
                                    (participant) => participant.photoURL
                                )
                                userData = {
                                    type: "group",
                                    uid,
                                    photoURL: groupProfileImg,
                                    name: uid,
                                    uids,
                                    displayNames,
                                    photoURLs
                                }
                            } else {
                                participants.forEach((participant) => {
                                    if (participant.uid !== props.user.uid) {
                                        userData = {
                                            ...participant,
                                            type: "user"
                                        }
                                    }
                                })
                            }
                            return userData
                        }
                    } catch (err) {
                        console.error(err)
                        return null
                    }
                })
            )
            // Filtering out null responses due to errors
            setChats([...tempUsers.filter((user) => user !== null)])
        }

        // Reference to the chat-dir collection
        const colRef = collection(props.firestore, "chat-directory")
        // Reference to the document containing user's chats
        const docRef = doc(colRef, props.user.uid)

        // Listening for real-time updates
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const chatUids = docSnap.data().chats
                fetchChatParticipants(chatUids)
            }
        })

        // Cleanup on unmount
        return () => unsubscribe()
    }, [props.user])

    const showChat = (e, conversation) => {
        selectedChat.current &&
            (selectedChat.current.style.backgroundColor = "transparent")
        e.currentTarget.style.backgroundColor = "#f6f6fe"
        selectedChat.current = e.currentTarget
        if (conversation.type === "user") {
            props.selectChat({
                type: "user",
                uid: sha1(conversation.uid + sessionStorage.getItem("uid"))
            })
            sessionStorage.setItem("other-user-uid", conversation.uid)
            sessionStorage.setItem("other-user-photoURL", conversation.photoURL)
            sessionStorage.setItem("other-user-displayName", conversation.name)
        } else {
            props.selectChat({
                type: "group",
                uid: conversation.uid
            })

            sessionStorage.setItem(
                "other-user-uids",
                JSON.stringify(conversation.uids)
            )
            sessionStorage.setItem(
                "other-user-photoURLs",
                JSON.stringify(conversation.photoURLs)
            )
            sessionStorage.setItem(
                "other-user-displayNames",
                JSON.stringify(conversation.displayNames)
            )
        }
    }

    const addGroupMembers = (e, index) => {
        e.currentTarget.style.backgroundColor = "#f6f6fe"
        setGroupMembers((prevGroupMembers) => [
            ...prevGroupMembers,
            {
                uid: conversations[index].uid,
                name: conversations[index].name,
                photoURL: conversations[index].photoURL
            }
        ])
    }

    return (
        <section className="chat-list">
            <Searchbar
                setSearchedUsers={setSearchedUsers}
                groupCreationToggle={setGroupCreationMode}
            />
            {conversations.map((chat, i) => (
                <div
                    className="chat-item"
                    key={chat.uid}
                    onClick={(e) => {
                        groupCreationMode
                            ? addGroupMembers(e, i)
                            : showChat(e, chat)
                    }}
                >
                    <img
                        src={chat.photoURL}
                        alt="user avatar"
                        className="profile-pic"
                    />
                    <div className="user-chat">
                        <h4 style={{ margin: 0 }}>{chat.name}</h4>
                        <span className="latest-msg">
                            {decryptMessage(latestMsgs[i])}
                        </span>
                    </div>
                </div>
            ))}
        </section>
    )
}

export default ChatList
