import { useEffect, useMemo, useRef, useState } from "react"
import "./chat-list.css"
import sha1 from "sha1"
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    getDoc,
    doc,
    setDoc
} from "firebase/firestore"

const ChatList = (props) => {
    const selectedUser = useRef(null)
    const [selectedUserIndex, setSelectedUserIndex] = useState(NaN)
    const [users, setUsers] = useState([
        {
            name: "Vegeta Saiyan",
            uid: "4CbYRdZ2iZLzkgmFDvvR7V",
            photoURL:
                "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"
        },
        {
            name: "Goku Kakarot",
            uid: "47BAitwF2PeWZLubmvSF6f",
            photoURL:
                "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"
        },
        {
            name: "King Cod",
            uid: "3vyVwmmoHz9Vx6RG8vXqvB",
            photoURL:
                "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"
        }
    ])

    const userData = useMemo(async () => {
        if (isNaN(selectedUserIndex)) {
            return
        }
        // Reference to the collection
        const colRef = collection(
            props.firestore,
            sha1(users[selectedUserIndex].uid + sessionStorage.getItem("uid"))
        )
        // Reference to the document
        const docRef = doc(colRef, "participants")
        // Fetch the document
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data())
            return docSnap.data()
        } else {
            const participantsData = {
                [sessionStorage.getItem("uid")]: [
                    sessionStorage.getItem("displayName"),
                    sessionStorage.getItem("profilePic")
                ],
                [users[selectedUserIndex].uid]: [
                    users[selectedUserIndex].name,
                    users[selectedUserIndex].photoURL
                ]
            }
            await setDoc(doc(colRef, "participants"), participantsData)
            console.log("No such document!")
            return participantsData
        }
    }, [selectedUserIndex])

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
            users.forEach((user, i) => {
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
                        tempUsers[i].msg = latestMsg[0].text
                        setUsers([...tempUsers])
                    }
                )
            })
        }
    }, [msgRefs])

    const showChat = (e, index) => {
        selectedUser.current &&
            (selectedUser.current.style.backgroundColor = "transparent")
        e.currentTarget.style.backgroundColor = "#f6f6fe"
        selectedUser.current = e.currentTarget
        props.selectChat(sha1(users[index].uid + sessionStorage.getItem("uid")))
        setSelectedUserIndex(index)
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
