import { useState, useEffect, useRef } from "react"
import "./App.css"
import "firebase/firestore"
import "firebase/auth"
import { initializeApp } from "firebase/app"
import {
    getAuth,
    signOut,
    signInWithCustomToken
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import axios from "axios"
import ChatBox from './chatbox';

const firebaseConfig = {
    apiKey: "AIzaSyA2xWMLsZu35nSeV4VJZQhhYXOoZC-66sw",
    authDomain: "chat-app-ca35e.firebaseapp.com",
    projectId: "chat-app-ca35e",
    storageBucket: "chat-app-ca35e.appspot.com",
    messagingSenderId: "995366670804",
    appId: "1:995366670804:web:b5t7c8355e838db6c548641",
    measurementId: "G-HHZDGQK3Z1"
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig)
const auth = getAuth()
const firestore = getFirestore()

function App() {
    const [user, setUser] = useState(null)
    const username = useRef("")
    const password = useRef("")

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
                "https://cc.dev.startupearly.com/api/token/",
                {
                    username: username.current,
                    password: password.current
                }
            )
            console.log("user authenticated", res.data)
            signInWithCustomToken(auth, res.data.firebase_token)
                .then((userCredential) => {
                    // Signed in
                    const user = userCredential.user
                    setUser(user)
                    console.log("User signed in:", user)
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

    return (
        <div className="App">
            {auth.currentUser && (
                <header>
                    <button className="sign-out" onClick={() => signOut(auth)}>
                        Sign Out
                    </button>
                </header>
            )}
            <section
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "90vh",
                    alignItems: "center"
                }}
            >
                {user ? (
                    <ChatBox auth={auth} firestore={firestore} />
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
