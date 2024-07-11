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

    const authTkn = useContext(authContext)

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

    const msgRefs = useMemo(() => {
        const tempMsgRefs = []
        users.forEach((user) => {
            tempMsgRefs.push(
                collection(
                    props.firestore,
                    sha1(user.uid + sessionStorage.getItem("uid"))
                )
            )
        })
        return [...tempMsgRefs]
    }, [users])

    useEffect(() => {
        if (msgRefs.length > 0) {
            users.forEach((_, i) => {
                const messageQuery = query(
                    msgRefs[i],
                    orderBy("createdAt", "desc"),
                    limit(1)
                )
                onSnapshot(messageQuery, (querySnapshot) => {
                    const latestMsg = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    const tempUsers = [...users]
                    tempUsers[i].msg = latestMsg[0].text
                        ? latestMsg[0]?.text
                        : latestMsg[0]?.filename
                    setUsers([...tempUsers])
                })
            })
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
                            const res = await axios.get(
                                `${
                                    import.meta.env.VITE_DEV_API_URL
                                }profile/${uid}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${authTkn}`
                                    }
                                }
                            )
                            return {
                                name: res.data.name,
                                uid,
                                photoURL: res.data.avatar
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
        props.selectChat(sha1(users[index].uid + sessionStorage.getItem("uid")))
        // setSelectedUserIndex(index)
        sessionStorage.setItem("other-user-uid", users[index].uid)
        sessionStorage.setItem("other-user-photoURL", users[index].photoURL)
        sessionStorage.setItem("other-user-displayName", users[index].name)
    }

    return (
        <section className="chat-list">
            <Searchbar />
            {users.map((user, i) => (
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
                            {decryptMessage(user.msg)}
                        </span>
                    </div>
                </div>
            ))}
        </section>
    )
}

export default ChatList
