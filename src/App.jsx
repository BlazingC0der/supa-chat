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
                `${import.meta.env.VITE_API_URL}token/`,
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
                            `${import.meta.env.VITE_API_URL}user/${user.uid}/`,
                            {
                                headers: {
                                    Authorization: `Bearer ${res.data.django_token.access}`
                                }
                            }
                        )
                        console.log("User signed in:", user)
                        sessionStorage.setItem("uid", user.uid)
                        sessionStorage.setItem(
                            "photoURL",
                            userInfo.data.user.image
                        )
                        sessionStorage.setItem(
                            "displayName",
                            userInfo.data.user.first_name +
                                " " +
                                userInfo.data.user.last_name
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

    const sendMsg = async (msg, textFlag = true, filename = "") => {
        const { uid } = auth.currentUser
        try {
            const dirColRef = collection(firestore, "chat-directory")
            const dirDocRefSelf = doc(dirColRef, sessionStorage.getItem("uid"))
            const dirDocRefOtherUser = doc(
                dirColRef,
                sessionStorage.getItem("other-user-uid")
            )
            await setDoc(
                dirDocRefSelf,
                {
                    chats: arrayUnion(sessionStorage.getItem("other-user-uid"))
                },
                { merge: true }
            )
            await setDoc(
                dirDocRefOtherUser,
                {
                    chats: arrayUnion(sessionStorage.getItem("uid"))
                },
                { merge: true }
            )
            // adding msg doc
            textFlag
                ? await addDoc(collection(firestore, selectedChat), {
                      text: CryptoJS.AES.encrypt(
                          msg,
                          import.meta.env.VITE_SECRET_KEY
                      ).toString(),createdAt: serverTimestamp(),
                      uid
                  })
                : await addDoc(collection(firestore, selectedChat), {
                      file: msg,
                      filename,
                      createdAt: serverTimestamp(),
                      uid
                  })
            console.log("Document successfully written!")
        } catch (error) {
            console.error("Error writing document: ", error)
        }
    }

    return (
        <div className="App">
            {user && (
                <header>
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
