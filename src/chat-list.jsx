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
import Searchbar from "./searchbar"
import { decryptMessage } from "./utils/decrypt"
import groupProfileImg from "./assets/group.png"
import { CircularProgress, styled } from "@mui/material"

const ChatList = (props) => {
    const selectedChat = useRef(null)
    const [chats, setChats] = useState([])
    const [latestMsgs, setLatestMsgs] = useState([])
    const [searchMode, setSearchMode] = useState(false)
    const [unreadMsgCounts, setUnreadMsgCounts] = useState([])
    const initRender = useRef(true)
    const chatIds = useRef([])
    const selectedChatId = useRef("")

    const Loader = styled(CircularProgress)({ color: "rgb(0, 0, 128)" })

    const msgRefs = useMemo(() => {
        chatIds.current = []
        return props.users
            ? null
            : chats.map((user) => {
                  const [uid, otherUserUid] = [
                      sessionStorage.getItem("uid"),
                      user?.uid
                  ]
                  const uids = [uid, otherUserUid].sort()
                  const chatUid =
                      user?.type === "group"
                          ? user?.uid
                          : sha1(uids[0] + uids[1])
                  chatIds.current.push(chatUid)
                  return collection(props.firestore, chatUid)
              })
    }, [chats.length])

    useEffect(() => {
        ;(async () => {
            try {
                const permisssion = await Notification.requestPermission()
                console.log("permission ", permisssion)
            } catch (error) {
                console.error(error)
            }
        })()
    }, [])

    useEffect(() => {
        if (!props.users) {
            if (msgRefs.length) {
                const msgUnsubscribers = msgRefs.map((ref, i) => {
                    const messageQuery = query(
                        ref,
                        orderBy("createdAt", "desc"),
                        limit(1)
                    )
                    return onSnapshot(messageQuery, (querySnapshot) => {
                        try {
                            setLatestMsgs((prevLatestMsgs) => {
                                const newLatestMsgs = [...prevLatestMsgs]
                                const latestMsg = querySnapshot.docs.map(
                                    (doc) => ({
                                        id: doc.id,
                                        ...doc.data()
                                    })
                                )
                                newLatestMsgs[i] = {
                                    text: latestMsg[0]?.text
                                        ? latestMsg[0]?.text
                                        : latestMsg[0]?.filename,
                                    sentTime: timeElapsed(
                                        latestMsg[0]?.createdAt
                                    )
                                }
                                if (
                                    !searchMode &&
                                    latestMsg[0] &&
                                    latestMsg[0]?.uid !==
                                        sessionStorage.getItem("uid")
                                ) {
                                    if (
                                        prevLatestMsgs.length >=
                                            msgRefs.length - 1 &&
                                        !initRender.current
                                    ) {
                                        new Notification(
                                            `${chats[i].name} sent a message`,
                                            {
                                                body: decryptMessage(
                                                    latestMsg[0]?.text ||
                                                        latestMsg[0]?.filename
                                                ),
                                                icon: chats[i].photoURL
                                            }
                                        )
                                    } else {
                                        initRender.current = false
                                    }
                                }
                                return newLatestMsgs
                            })
                        } catch (error) {
                            console.error(error)
                        }
                    })
                })
                const unreadUnsubscribers = msgRefs.map((ref, i) => {
                    const unreadQuery = query(ref, orderBy("userData"))
                    return onSnapshot(unreadQuery, (querySnapshot) => {
                        try {
                            setUnreadMsgCounts((prevUnreadMsgCounts) => {
                                const newUnreadMsgsCounts = [
                                    ...prevUnreadMsgCounts
                                ]
                                const unreadMsgsCount = querySnapshot.docs
                                    .map((doc) => ({
                                        id: doc.id,
                                        ...doc?.data()
                                    }))[0]
                                    ?.userData?.filter(
                                        (user) => user.uid === props.user.uid
                                    )[0].unread
                                if (
                                    ref._path.segments[0] ===
                                    selectedChatId.current
                                ) {
                                    if (unreadMsgsCount) {
                                        resetUnreadMsgsCount()
                                    }
                                    newUnreadMsgsCounts[i] = 0
                                } else {
                                    newUnreadMsgsCounts[i] = unreadMsgsCount
                                }
                                return [...newUnreadMsgsCounts]
                            })
                        } catch (error) {
                            console.error(error)
                        }
                    })
                })
                // Clean up the onSnapshot listeners on unmount
                return () => {
                    msgUnsubscribers.forEach((unsubscribe) => unsubscribe())
                    unreadUnsubscribers.forEach((unsubscribe) => unsubscribe())
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
                            console.error("chat fetch err", err)
                            return null
                        }
                    })
                )
                // Filtering out null responses due to errors
                setChats([...tempUsers.filter((user) => user !== null)])
                sessionStorage.setItem("chats", JSON.stringify(tempUsers))
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

    const showChat = async (e, conversation) => {
        if (window.innerWidth <= 850) {
            document.querySelector(".chat-list").style.display = "none"
            document.querySelector(".chat-box").style.display = "flex"
            document.querySelector(".msg-controls").style.display = "none"
            document.querySelector(".chat-info").style.display = "flex"
            document.querySelector(".msg-menu-controls").style.display = "none"
        }
        selectedChat.current &&
            (selectedChat.current.style.backgroundColor = "transparent")
        e.currentTarget.style.backgroundColor = "#f6f6fe"
        selectedChat.current = e.currentTarget
        if (conversation.type === "user") {
            const [uid, otherUserUid] = [
                sessionStorage.getItem("uid"),
                conversation.uid
            ]
            const uids = [uid, otherUserUid].sort()
            selectedChatId.current = sha1(uids[0] + uids[1])
            props.selectChat({
                type: "user",
                uid: selectedChatId.current,
                name: conversation.name,
                avatar: conversation.photoURL
            })
            sessionStorage.setItem("other-user-uid", conversation.uid)
            sessionStorage.setItem("other-user-photoURL", conversation.photoURL)
            sessionStorage.setItem("other-user-displayName", conversation.name)
        } else {
            const members = conversation.displayNames.map(
                (displayName, index) => {
                    return {
                        uid: conversation.uids[index],
                        name: displayName,
                        photoURL: conversation.photoURLs[index]
                    }
                }
            )
            selectedChatId.current = conversation.uid
            props.selectChat({
                type: "group",
                uid: conversation.uid,
                name: conversation.name,
                avatar: conversation.photoURL,
                members
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
        props.users && !props.checkBoxSelection && props.closeModal()
        await resetUnreadMsgsCount()
    }

    const resetUnreadMsgsCount = async () => {
        if (!searchMode) {
            try {
                const chatColRef = collection(
                    props.firestore,
                    selectedChatId.current
                )
                const participantsDocRef = doc(chatColRef, "participants")
                const participantsData = (
                    await getDoc(participantsDocRef)
                ).data()?.userData
                participantsData?.forEach((participant) => {
                    if (participant.uid === props.user.uid) {
                        participant.unread = 0
                    }
                })
                await setDoc(participantsDocRef, {
                    userData: [...participantsData]
                })
            } catch (error) {
                console.error(error)
            }
        }
    }

    const addGroupMember = (user) => {
        props.mutateMembers((prevGroupMembers) => [
            ...prevGroupMembers,
            {
                uid: user.uid.toString(),
                name: user.name,
                photoURL: user.photoURL,
                fname: user.fname,
                lname: user.lname
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

    const timeElapsed = (timestamp) => {
        // Convert the given timestamp to a Date object
        const date = new Date(
            timestamp?.seconds * 1000 + timestamp?.nanoseconds / 1000000
        )
        // Get the current time
        const now = new Date()
        // Calculate the difference in milliseconds
        const diffMs = now - date
        // Convert milliseconds to a more readable format
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor(
            (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        )
        const diffMinutes = Math.floor(
            (diffMs % (1000 * 60 * 60)) / (1000 * 60)
        )
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000)
        return {
            days: diffDays,
            hours: diffHours,
            minutes: diffMinutes,
            seconds: diffSeconds
        }
    }

    return (
        <>
            <section
                className="chat-list"
                style={{
                    width: props.users ? "100%" : "25vw",
                    borderRight: props.users
                        ? "none"
                        : "0.5px solid rgba(198, 198, 198, 0.726)",
                    padding: props.users
                        ? props.selectionMode
                            ? "0px"
                            : "10px"
                        : "15px",
                    minHeight: props.users && "165px",
                    justifyContent:
                        props.users || chats.length ? "flex-start" : "center"
                }}
            >
                {!props.users && (
                    <Searchbar
                        setSearchedChats={setChats}
                        chats={chats}
                        setSearchMode={setSearchMode}
                    />
                )}
                {props.users ? (
                    props.users.map((user) => (
                        <div
                            className="chat-item"
                            style={{
                                width: "100%",
                                justifyContent: "space-between",
                                paddingLeft: props.users ? "0px" : "5px",
                                cursor:
                                    props.users && props.checkBoxSelection
                                        ? "initial"
                                        : "pointer"
                            }}
                            key={user.uid}
                            onClick={(e) => {
                                !props.checkBoxSelection && showChat(e, user)
                            }}
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
                            {props.selectionMode &&
                                (props.checkBoxSelection ? (
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
                                ) : (
                                    <span className="material-symbols-outlined">
                                        chevron_right
                                    </span>
                                ))}
                        </div>
                    ))
                ) : !chats.length ? (
                    <div style={{ margin: "auto" }}>
                        {!searchMode ? (
                            <Loader size={100} />
                        ) : (
                            <h3>No Users Found</h3>
                        )}
                    </div>
                ) : (
                    chats.map((chat, i) =>
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
                                    <div className="chat-basic-info">
                                        <h4
                                            style={{
                                                margin: 0,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                width: "100%",
                                                textWrap: "nowrap"
                                            }}
                                        >
                                            {chat.name}
                                        </h4>
                                        <span className="latest-msg">
                                            {decryptMessage(
                                                latestMsgs[i]?.text
                                            )}
                                        </span>
                                    </div>
                                    <div className="chat-notifiers">
                                        {latestMsgs[i]?.text && (
                                            <span
                                                style={{
                                                    color: "grey",
                                                    fontSize: "12px"
                                                }}
                                            >
                                                {latestMsgs[i]?.sentTime.days >
                                                0
                                                    ? latestMsgs[i]?.sentTime
                                                          .days + "d"
                                                    : latestMsgs[i]?.sentTime
                                                          .hours > 0
                                                    ? latestMsgs[i]?.sentTime
                                                          .hours + "h"
                                                    : latestMsgs[i]?.sentTime
                                                          .minutes > 0
                                                    ? latestMsgs[i]?.sentTime
                                                          .minutes + "m"
                                                    : latestMsgs[i]?.sentTime
                                                          .seconds > 0
                                                    ? latestMsgs[i]?.sentTime
                                                          .seconds + "s"
                                                    : "just now"}
                                            </span>
                                        )}
                                        {unreadMsgCounts[i] > 0 && (
                                            <span className="unseen-msgs">
                                                {unreadMsgCounts[i]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null
                    )
                )}
            </section>
        </>
    )
}

export default ChatList
