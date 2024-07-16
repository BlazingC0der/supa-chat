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
    doc
} from "firebase/firestore"
import Searchbar from "./searchbar"
import { decryptMessage } from "./utils/decrypt"
import groupProfileImg from "./assets/group.png"

const ChatList = (props) => {
    const selectedChat = useRef(null)
    const [chats, setChats] = useState([])
    const [searchedUsers, setSearchedUsers] = useState([])
    const [latestMsgs, setLatestMsgs] = useState([])

    const conversations = useMemo(() => {
        return searchedUsers.length ? searchedUsers : chats
    }, [searchedUsers, chats])

    const msgRefs = useMemo(
        () =>
            props.users
                ? null
                : conversations.map((user) =>
                      collection(
                          props.firestore,
                          sha1(user.uid + sessionStorage.getItem("uid"))
                      )
                  ),
        [conversations]
    )

    useEffect(() => {
        if (!props.users) {
            if (msgRefs.length) {
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
                            console.log("latestMsg", latestMsg)
                            newLatestMsgs[i] = latestMsg[0]?.text
                                ? latestMsg[0]?.text
                                : latestMsg[0]?.filename
                            return newLatestMsgs
                        })
                    })
                })
                // Clean up the onSnapshot listeners on unmount
                return () => {
                    unsubscribers.forEach((unsubscribe) => unsubscribe())
                }
            }
        }
    }, [msgRefs])

    useEffect(() => {
        if (!props.users) {
            const fetchChatParticipants = async (chatUids) => {
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
                                let userData
                                if (participants.length > 2) {
                                    const uids = participants.map(
                                        (participant) => participant.uid
                                    )
                                    const displayNames = participants.map(
                                        (participant) => participant.name
                                    )
                                    const photoURLs = participants.map(
                                        (participant) => participant.photoURL
                                    )
                                    const groupDataDocRef = await getDoc(
                                        doc(chatRef, "groupData")
                                    )
                                    const groupData = groupDataDocRef.data()
                                    userData = {
                                        type: "group",
                                        uid,
                                        photoURL: groupProfileImg,
                                        name: groupData.name,
                                        uids,
                                        displayNames,
                                        photoURLs
                                    }
                                } else {
                                    participants.forEach((participant) => {
                                        if (
                                            participant.uid !== props.user.uid
                                        ) {
                                            userData = {
                                                ...participant,
                                                type: "user"
                                            }
                                        }
                                    })
                                }
                                return userData
                            }
                        } catch (err) {
                            console.error(err)
                            return null
                        }
                    })
                )
                // Filtering out null responses due to errors
                setChats([...tempUsers.filter((user) => user !== null)])
            }

            // Reference to the chat-dir collection
            const colRef = collection(props.firestore, "chat-directory")
            // Reference to the document containing user's chats
            const docRef = doc(colRef, props.user.uid)

            // Listening for real-time updates
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const chatUids = docSnap.data().chats
                    fetchChatParticipants(chatUids)
                }
            })

            // Cleanup on unmount
            return () => unsubscribe()
        }
    }, [props.user])

    const showChat = (e, conversation) => {
        selectedChat.current &&
            (selectedChat.current.style.backgroundColor = "transparent")
        e.currentTarget.style.backgroundColor = "#f6f6fe"
        selectedChat.current = e.currentTarget
        if (conversation.type === "user") {
            props.selectChat({
                type: "user",
                uid: sha1(conversation.uid + sessionStorage.getItem("uid"))
            })
            sessionStorage.setItem("other-user-uid", conversation.uid)
            sessionStorage.setItem("other-user-photoURL", conversation.photoURL)
            sessionStorage.setItem("other-user-displayName", conversation.name)
        } else {
            props.selectChat({
                type: "group",
                uid: conversation.uid
            })

            sessionStorage.setItem(
                "other-user-uids",
                JSON.stringify(conversation.uids)
            )
            sessionStorage.setItem(
                "other-user-photoURLs",
                JSON.stringify(conversation.photoURLs)
            )
            sessionStorage.setItem(
                "other-user-displayNames",
                JSON.stringify(conversation.displayNames)
            )
        }
    }

    const addGroupMember = (user) => {
        props.mutateMembers((prevGroupMembers) => [
            ...prevGroupMembers,
            {
                uid: user.uid.toString(),
                name: user.name,
                photoURL: user.photoURL
            }
        ])
    }

    const removeGroupMember = (user) => {
        props.mutateMembers((prevGroupMembers) => {
            return [
                ...prevGroupMembers.filter((member) => member.uid !== user.uid)
            ]
        })
    }

    return (
        <section
            className="chat-list"
            style={{
                width: props.users ? "100%" : "30%",
                borderRight: props.users
                    ? "none"
                    : "0.5px solid rgba(198, 198, 198, 0.726)",
                padding: props.users ? "0px" : "15px",
                minHeight: props.users && "165px"
            }}
        >
            {!props.users && <Searchbar setSearchedUsers={setSearchedUsers} />}
            {props.users
                ? props.users.map((user) => (
                      <div
                          className="chat-item"
                          style={{
                              width: "100%",
                              justifyContent: "space-between",
                              paddingLeft: props.users ? "0px" : "5px",
                              cursor: props.users ? "initial" : "pointer"
                          }}
                          key={user.uid}
                      >
                          <div className="user-info">
                              <img
                                  src={user.photoURL}
                                  alt="user avatar"
                                  className="profile-pic"
                              />
                              <div className="user-chat">
                                  <h4 style={{ margin: 0 }}>{user.name}</h4>
                              </div>
                          </div>
                          <div
                              className="custom-checkbox"
                              onClick={(e) => {
                                  e.target.classList.toggle(
                                      "custom-checkbox-clicked"
                                  )
                                  e.target.classList.contains(
                                      "custom-checkbox-clicked"
                                  )
                                      ? addGroupMember(user)
                                      : removeGroupMember(user)
                              }}
                          />
                      </div>
                  ))
                : conversations.map((chat, i) =>
                      chat ? (
                          <div
                              className="chat-item"
                              key={chat.uid}
                              onClick={(e) => {
                                  showChat(e, chat)
                              }}
                          >
                              <img
                                  src={chat.photoURL}
                                  alt="user avatar"
                                  className="profile-pic"
                              />
                              <div className="user-chat">
                                  <h4 style={{ margin: 0 }}>{chat.name}</h4>
                                  <span className="latest-msg">
                                      {decryptMessage(latestMsgs[i])}
                                  </span>
                              </div>
                          </div>
                      ) : null
                  )}
        </section>
    )
}

export default ChatList
