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

const ChatList = (props) => {
    const selectedUser = useRef(null)
    // const [selectedUserIndex, setSelectedUserIndex] = useState(NaN)
    const [users, setUsers] = useState([
        {
            name: `Prince Vegeta`,
            uid: "gRzr5dFvCHtATXWe",
            photoURL:
                "https://static.vecteezy.com/system/resources/previews/036/594/092/large_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"
        },
        {
            name: `Goku Kakarot`,
            uid: "gRzr5dFvCHtATXWc",
            photoURL:
                "https://static.vecteezy.com/system/resources/previews/036/594/092/large_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"
        },
        {
            name: `Beerus Kitty`,
            uid: "gRzr5dFvCHtATXWd",
            photoURL:
                "https://static.vecteezy.com/system/resources/previews/036/594/092/large_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"
        }
    ])

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
                const unsubscribe = onSnapshot(
                    messageQuery,
                    (querySnapshot) => {
                        const latestMsg = querySnapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data()
                        }))
                        const tempUsers = [...users]
                        tempUsers[i].msg = latestMsg[0]?.text
                        setUsers([...tempUsers])
                    }
                )
            })
        }
    }, [msgRefs])

    useEffect(() => {
        ;(async () => {
            // Reference to the chat-dir collection
            const colRef = collection(props.firestore, "chat-directory")
            // Reference to the document containing user's chats
            const docRef = doc(colRef, sessionStorage.getItem("uid"))
            // Fetching the document
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                const tempUsers = [...users]
                console.log("chats", docSnap.data().chats)
                docSnap.data().chats.forEach(async (chat) => {
                    try {
                        const res = await axios.get(
                            `${import.meta.env.VITE_API_URL}user/${chat}/`,
                            { headers: { Authorization: `Bearer ${authTkn}` } }
                        )
                        console.log("chat user", res.data)
                        tempUsers.push({
                            name: `${res.data.user.first_name} ${res.data.user.last_name}`,
                            uid: res.data.user.id,
                            photoURL: res.data.user.image
                        })
                    } catch (err) {
                        console.error(err)
                    }
                })
                setUsers([...tempUsers])
            }
        })()
    }, [props.auth])

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
            {users.map((user, i) => (
                <div className="chat-item" onClick={(e) => showChat(e, i)}>
                    <img
                        src={user.photoURL}
                        alt="user avatar"
                        className="profile-pic"
                    />
                    <div className="user-chat">
                        <h4 style={{ margin: 0 }}>{user.name}</h4>
                        <span className="latest-msg">{user.msg}</span>
                    </div>
                </div>
            ))}
        </section>
    )
}

export default ChatList
