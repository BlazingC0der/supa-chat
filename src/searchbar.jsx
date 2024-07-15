import axios from "axios"
import "./searchbar.css"
import { useRef } from "react"

const Searchbar = (props) => {
    const timeoutId = useRef(NaN)
    const searchUser = (e) => {
        !isNaN(timeoutId.current) && clearInterval(timeoutId.current)
        timeoutId.current = setTimeout(async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_DEV_API_URL}user-profile/${
                        e.target.value
                    }`
                )
                !res.data
                    ? props.setSearchedUsers([])
                    : props.setSearchedUsers([
                          {
                              name: res.data.name,
                              uid: res.data.user,
                              photoURL: res.data.avatar,
                              type: "user"
                          }
                      ])
            } catch (error) {
                props.setSearchedUsers([])
                console.error(error)
            }
        }, 1000)
    }

    return (
        <div className="user-search">
            <input
                type="text"
                name="user-search"
                id="user-search"
                className="searchbar"
                placeholder="Search messages"
                onChange={searchUser}
            />
            <button
                className="grouping-btn"
                onClick={() => {
                    document
                        .querySelector(".grouping-btn")
                        .classList.toggle("grouping-btn-clicked")
                    props.groupCreationToggle((creationMode) => !creationMode)
                }}
            >
                New Group
            </button>
        </div>
    )
}

export default Searchbar
