import "./searchbar.css"

const searchUser = (e) => {
    setTimeout(() => {
        console.log(e.target.value)
    }, 1000)
}

const Searchbar = () => {
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
