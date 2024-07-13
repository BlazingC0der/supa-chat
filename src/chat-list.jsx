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
import axios from "axios"
import { authContext } from "./App"
import Searchbar from "./searchbar"
import { decryptMessage } from "./utils/decrypt"

const ChatList = (props) => {
    const selectedUser = useRef(null)
    // const [selectedUserIndex, setSelectedUserIndex] = useState(NaN)
    const [users, setUsers] = useState([])
    const [searchedUsers, setSearchedUsers] = useState([])
    const [groupCreationMode, setGroupCreationMode] = useState(false)
    const [groupMembers, setGroupMembers] = useState([])
    const [latestMsgs, setLatestMsgs] = useState([])

    // const userData = useMemo(async () => {
    //     if (isNaN(selectedUserIndex)) {
    //         return
    //     }
    //     // Reference to the collection
    //     const colRef = collection(
    //         props.firestore,
    //         sha1(users[selectedUserIndex].uid + sessionStorage.getItem("uid"))
    //     )
    //     // Reference to the document
    //     const docRef = doc(colRef, "participants")
    //     // Fetching the document
    //     const docSnap = await getDoc(docRef)
    //     if (docSnap.exists()) {
    //         console.log("Document data:", docSnap.data())
    //         return docSnap.data()
    //     } else {
    //         const participantsData = {
    //             [sessionStorage.getItem("uid")]: [
    //                 sessionStorage.getItem("displayName"),
    //                 sessionStorage.getItem("photoURL")
    //             ],
    //             [users[selectedUserIndex].uid]: [
    //                 users[selectedUserIndex].name,
    //                 users[selectedUserIndex].photoURL
    //             ]
    //         }
    //         await setDoc(doc(colRef, "participants"), participantsData)
    //         console.log("No such document!")
    //         return participantsData
    //     }
    // }, [selectedUserIndex])

    useEffect(() => {
        console.log("LM", latestMsgs)
    }, [latestMsgs])

    const conversations = useMemo(() => {
        return searchedUsers.length ? searchedUsers : users
    }, [searchedUsers, users])

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
                        newLatestMsgs[i] = latestMsg[0]?.text
                            ? latestMsg[0]?.text
                            : latestMsg[0]?.filename
                        console.log(newLatestMsgs)
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
        ;(async () => {
            // Reference to the chat-dir collection
            const colRef = collection(props.firestore, "chat-directory")
            // Reference to the document containing user's chats
            const docRef = doc(colRef, props.user.uid)
            // Fetching the document
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                const chatUids = docSnap.data().chats
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
                                const userData = []
                                participants.forEach((participant) => {
                                    if (participant.uid !== props.user.uid) {
                                        userData.push(participant)
                                    }
                                })
                                return userData.length > 1
                                    ? userData
                                    : userData[0]
                            }
                        } catch (err) {
                            console.error(err)
                            return null
                        }
                    })
                )
                // Filtering out null responses due to errors
                setUsers([...tempUsers.filter((user) => user !== null)])
            }
        })()
    }, [props.user])

    const showChat = (e, index) => {
        selectedUser.current &&
            (selectedUser.current.style.backgroundColor = "transparent")
        e.currentTarget.style.backgroundColor = "#f6f6fe"
        selectedUser.current = e.currentTarget
        props.selectChat(
            sha1(conversations[index].uid + sessionStorage.getItem("uid"))
        )
        // setSelectedUserIndex(index)
        sessionStorage.setItem("other-user-uid", conversations[index].uid)
        sessionStorage.setItem(
            "other-user-photoURL",
            conversations[index].photoURL
        )
        sessionStorage.setItem(
            "other-user-displayName",
            conversations[index].name
        )
    }

    return (
        <section className="chat-list">
            <Searchbar setSearchedUsers={setSearchedUsers} groupCreationToggle={setGroupCreationMode} />
            {conversations.map((user, i) => (
                <div
                    className="chat-item"
                    key={user.uid}
                    onClick={(e) => showChat(e, i)}
                >
                    <img
                        src={user.photoURL}
                        alt="user avatar"
                        className="profile-pic"
                    />
                    <div className="user-chat">
                        <h4 style={{ margin: 0 }}>{user.name}</h4>
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
