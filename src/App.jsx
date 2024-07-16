import { useState, useEffect, useRef, createContext } from "react"
import "./App.css"
import { initializeApp } from "firebase/app"
import { getAuth, signOut, signInWithCustomToken } from "firebase/auth"
import {
    getFirestore,
    addDoc,
    serverTimestamp,
    collection,
    doc,
    setDoc,
    arrayUnion
} from "firebase/firestore"
import axios from "axios"
import ChatBox from "./chatbox"
import ChatList from "./chat-list"
import CryptoJS from "crypto-js"
import sha1 from "sha1"
import GroupModal from "./group-creation-modal"

const firebaseConfig = {
    apiKey: "AIzaSyA2xWMLsZu35nSeV4VJZQhhYXOoZC-66sw",
    authDomain: "chat-app-ca35e.firebaseapp.com",
    projectId: "chat-app-ca35e",
    storageBucket: "chat-app-ca35e.appspot.com",
    messagingSenderId: "995366670804",
    appId: "1:995366670804:web:b5t7c8355e838db6c548641",
    measurementId: "G-HHZDGQK3Z1"
}

export const authContext = createContext()

// Initialize Firebase app
initializeApp(firebaseConfig)
const auth = getAuth()
const firestore = getFirestore()

function App() {
    const [user, setUser] = useState(null)
    const [selectedChat, setSelectedChat] = useState(null)
    const [openGroupModal, setOpenGroupModal] = useState(false)
    const username = useRef("")
    const password = useRef("")
    const authTkn = useRef("")

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser)
        })
        console.log("auth", auth)
        return unsubscribe
    }, [auth])

    const signIn = async (e) => {
        e.preventDefault()
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_DEV_API_URL}token/`,
                {
                    username: username.current,
                    password: password.current
                }
            )
            console.log("user authenticated", res.data)
            authTkn.current = res.data.django_token.access
            signInWithCustomToken(auth, res.data.firebase_token)
                .then(async (userCredential) => {
                    // Signed in
                    const user = userCredential.user
                    try {
                        const userInfo = await axios.get(
                            `${import.meta.env.VITE_DEV_API_URL}profile/${
                                user.uid
                            }`,
                            {
                                headers: {
                                    Authorization: `Bearer ${res.data.django_token.access}`
                                }
                            }
                        )
                        console.log("User signed in:", user)
                        sessionStorage.setItem("uid", user.uid)
                        sessionStorage.setItem("photoURL", userInfo.data.avatar)
                        sessionStorage.setItem(
                            "displayName",
                            userInfo.data.name
                        )
                        setUser(user)
                    } catch (error) {
                        console.error(error)
                    }
                })
                .catch((error) => {
                    const errorCode = error.code
                    const errorMessage = error.message
                    console.error("Error signing in:", errorCode, errorMessage)
                })
        } catch (error) {
            console.error(error)
        }
    }
    const sendMsg = async (
        msg,
        groupMsg,
        textFlag = true,
        filename = "",
    ) => {
        const [uid, otherUserUid] = [
            sessionStorage.getItem("uid"),
            sessionStorage.getItem("other-user-uid")
        ]
        try {
            const dirColRef = collection(firestore, "chat-directory")
            const dirDocRefSelf = doc(dirColRef, uid)
            const chatColRef = collection(firestore, selectedChat.uid)
            const participantsDocRef = doc(chatColRef, "participants")
            if (!groupMsg) {
                const dirDocRefOtherUser = doc(dirColRef, otherUserUid)
                await setDoc(
                    participantsDocRef,
                    {
                        userData: arrayUnion(
                            {
                                uid: uid,
                                name: sessionStorage.getItem("displayName"),
                                photoURL: sessionStorage.getItem("photoURL")
                            },
                            {
                                uid: otherUserUid,
                                name: sessionStorage.getItem(
                                    "other-user-displayName"
                                ),
                                photoURL: sessionStorage.getItem(
                                    "other-user-photoURL"
                                )
                            }
                        )
                    },
                    { merge: true }
                )
                await setDoc(
                    dirDocRefSelf,
                    {
                        chats: arrayUnion(sha1(otherUserUid + uid))
                    },
                    { merge: true }
                )
                await setDoc(
                    dirDocRefOtherUser,
                    {
                        chats: arrayUnion(sha1(otherUserUid + uid))
                    },
                    { merge: true }
                )
            }
            // adding msg doc
            textFlag
                ? await addDoc(chatColRef, {
                      text: CryptoJS.AES.encrypt(
                          msg,
                          import.meta.env.VITE_SECRET_KEY
                      ).toString(),
                      createdAt: serverTimestamp(),
                      uid
                  })
                : await addDoc(chatColRef, {
                      file: msg,
                      filename: CryptoJS.AES.encrypt(
                          filename,
                          import.meta.env.VITE_SECRET_KEY
                      ).toString(),
                      createdAt: serverTimestamp(),
                      uid
                  })
            console.log("Document successfully written!")
        } catch (error) {
            console.error("Error writing document: ", error)
        }
    }

    const createGroup = async (members, groupName) => {
        const dirColRef = collection(firestore, "chat-directory")
        console.log("members", members)
        const dirDocRefsGroupMembers = members.map((member) =>
            doc(dirColRef, member.uid.toString())
        )
        dirDocRefsGroupMembers.push(
            doc(dirColRef, sessionStorage.getItem("uid"))
        )
        let memberIds = ""
        let groupChatUid
        members.forEach((member) => {
            memberIds += member.uid
        })
        groupChatUid = sha1(memberIds)
        members = [
            ...members,
            {
                uid: sessionStorage.getItem("uid"),
                name: sessionStorage.getItem("displayName"),
                photoURL: sessionStorage.getItem("photoURL")
            }
        ]
        try {
            const chatColRef = collection(firestore, groupChatUid)
            await setDoc(doc(chatColRef, "participants"), {
                userData: [...members]
            })
            await setDoc(doc(chatColRef, "groupData"), {
                name: groupName
            })
            dirDocRefsGroupMembers.forEach(async (dirDocRef) => {
                await setDoc(
                    dirDocRef,
                    {
                        chats: arrayUnion(groupChatUid)
                    },
                    { merge: true }
                )
            })
        } catch (error) {
            console.error("Error creating group: ", error)
        }
    }

    return (
        <div className="App">
            <GroupModal
                openModal={setOpenGroupModal}
                open={openGroupModal}
                firestore={firestore}
                createGroup={createGroup}
            />
            {user && (
                <header>
                    <button
                        className="grouping-btn"
                        onClick={() => setOpenGroupModal(true)}
                    >
                        New Group
                    </button>
                    <button
                        className="sign-out"
                        onClick={() => {
                            sessionStorage.clear()
                            signOut(auth)
                        }}
                    >
                        Sign Out
                    </button>
                </header>
            )}
            <section className="chats">
                {user ? (
                    <authContext.Provider value={authTkn.current}>
                        <ChatList
                            selectChat={setSelectedChat}
                            user={user}
                            firestore={firestore}
                            createGroup={createGroup}
                        />
                        <ChatBox
                            auth={auth}
                            firestore={firestore}
                            send={sendMsg}
                            selectedChat={selectedChat}
                        />
                    </authContext.Provider>
                ) : (
                    <>
                        <form onSubmit={signIn} className="login-form">
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={(e) =>
                                    (username.current = e.target.value)
                                }
                            />
                            <input
                                type="password"
                                name="pwd"
                                id="pwd"
                                onChange={(e) =>
                                    (password.current = e.target.value)
                                }
                            />
                            <input type="submit" value="Sign In" />
                        </form>
                    </>
                )}
            </section>
        </div>
    )
}

export default App
