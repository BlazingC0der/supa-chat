import axios from "axios"
import "./searchbar.css"

const Searchbar = (props) => {
    const searchUser = async (e) => {
        if (!e.target.value.length) {
            props.setSearchedChats(JSON.parse(sessionStorage.getItem("chats")))
        } else if (e.target.value.length > 2) {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_DEV_API_URL}search-user/?query=${
                        e.target.value
                    }`
                )
                !res.data
                    ? props.setSearchedChats([])
                    : e.target.value.length &&
                      props.setSearchedChats(
                          res.data.map((chat) => {
                              return {
                                  name: chat.name,
                                  uid: chat.user,
                                  photoURL: chat.avatar,
                                  fname: chat.firstname,
                                  lname: chat.lastname,
                                  type: "user"
                              }
                          })
                      )
            } catch (error) {
                props.setSearchedChats([])
                console.error(error)
            }
        }
    }

    return (
        <div className="user-search">
            <input
                type="text"
                name="user-search"
                id="user-search"
                className="searchbar"
                placeholder="Search users"
                onChange={searchUser}
                onFocus={() => props.setSearchMode && props.setSearchMode(true)}
                onBlur={() => props.setSearchMode && props.setSearchMode(false)}
                style={{ width: props.width ? props.width : "90%" }}
            />
        </div>
    )
}

export default Searchbar
