import { useRef } from "react"
import "./chat-list.css"
import sha1 from "sha1"

const ChatList = (props) => {
    const selectedUser = useRef(null)
    const users = [
        { name: "Vegeta Saiyan", uid: "4CbYRdZ2iZLzkgmFDvvR7V" },
        { name: "Goku Kakarot", uid: "47BAitwF2PeWZLubmvSF6f" },
        { name: "King Cod", uid: "3vyVwmmoHz9Vx6RG8vXqvB" }
    ]

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
                    <h4>{user.name}</h4>
                </div>
            ))}
        </section>
    )
}

export default ChatList
