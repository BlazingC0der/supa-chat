import { useEffect, useMemo, useRef, useState } from "react"
import "./chat-list.css"
import sha1 from "sha1"
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore"

const ChatList = (props) => {
    const selectedUser = useRef(null)
    const [users, setUsers] = useState([
        { name: "Vegeta Saiyan", uid: "4CbYRdZ2iZLzkgmFDvvR7V" },
        { name: "Goku Kakarot", uid: "47BAitwF2PeWZLubmvSF6f" },
        { name: "King Cod", uid: "3vyVwmmoHz9Vx6RG8vXqvB" }
    ])
    // const [msgRefs, setMsgRefs] = useState([])
    const msgRefs = useMemo(() => {
        const tempMsgRefs = []
        users.forEach((user) => {
            tempMsgRefs.push(
                collection(
                    props.firestore,
                    sha1(user.uid + props.auth.currentUser.uid)
                )
            )
        })
        return [...tempMsgRefs]
    }, [users])

    // useEffect(() => {
    //     const tempMsgRefs = [...msgRefs]
    //     users.forEach((user) => {
    //         tempMsgRefs.push(
    //             collection(
    //                 props.firestore,
    //                 sha1(user.uid + props.auth.currentUser.uid)
    //             )
    //         )
    //     })
    //     setMsgRefs([...tempMsgRefs])
    // }, [users])

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
                        console.log("latest msg", latestMsg)
                        const tempUsers = [...users]
                        tempUsers[i].msg = latestMsg[0].text
                        setUsers([...tempUsers])
                    }
                )
            })
        }
    }, [msgRefs])

    const showChat = (e, uid) => {
        selectedUser.current &&
            (selectedUser.current.style.backgroundColor = "transparent")
        e.currentTarget.style.backgroundColor = "#f6f6fe"
        selectedUser.current = e.currentTarget
        props.selectChat(sha1(uid + props.auth.currentUser.uid))
    }

    return (
        <section className="chat-list">
            {users.map((user) => (
                <div
                    className="chat-item"
                    onClick={(e) => showChat(e, user.uid)}
                >
                    <img
                        src="https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"
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
