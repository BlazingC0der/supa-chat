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
                              photoURL: res.data.avatar
                          }
                      ])
            } catch (error) {
                props.setSearchedUsers([])
                console.error(error)
            }
        }, 3000)
    }

    return (
        <input
            type="text"
            name="user-search"
            id="user-search"
            className="searchbar"
            placeholder="Search messages"
            onChange={searchUser}
        />
    )
}

export default Searchbar
