import { useState, useEffect } from "react"
import "./App.css"
import "firebase/firestore"
import "firebase/auth"
import ChatBox from "./chatbox"
import ChatList from "./chat-list"
import { initializeApp } from "firebase/app"
import {
    getAuth,
    signInWithPopup,
    signOut,
    GoogleAuthProvider
} from "firebase/auth"
import {
    getFirestore,
    serverTimestamp,
    collection,
    addDoc
} from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyA2xWMLsZu35nSeV4VJZQhhYXOoZC-66sw",
    authDomain: "chat-app-ca35e.firebaseapp.com",
    projectId: "chat-app-ca35e",
    storageBucket: "chat-app-ca35e.appspot.com",
    messagingSenderId: "995366670804",
    appId: "1:995366670804:web:b57c8355e838db6c548641",
    measurementId: "G-HHZDGQK3Z1"
}

// Initialize Firebase app
initializeApp(firebaseConfig)
const auth = getAuth()
const firestore = getFirestore()

function App() {
    const [user, setUser] = useState(null)
    const [selectedChat, setSelectedChat] = useState("")
    // const [latestMsg, setLatestMsg] = useState("")

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser)
        })
        return unsubscribe
    }, [auth])

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider()
        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential =
                    GoogleAuthProvider.credentialFromResult(result)
                const token = credential.accessToken
                // The signed-in user info.
                console.log("User Info: ", auth.currentUser)
                sessionStorage.setItem("uid", auth.currentUser.uid)
            })
            .catch((error) => {
                // Handle Errors here.
                const errorCode = error.code
                const errorMessage = error.message
                // The email of the user's account used.
                const email = error.customData.email
                // The AuthCredential type that was used.
                const credential = GoogleAuthProvider.credentialFromError(error)
                console.error(
                    "Error: ",
                    errorMessage,
                    errorCode,
                    email,
                    credential
                )
            })
    }

    const sendMsg = async (text) => {
        const { uid, displayName, photoURL } = auth.currentUser
        try {
            // Add a new document with a generated ID
            await addDoc(collection(firestore, selectedChat), {
                text,
                createdAt: serverTimestamp(),
                uid,
                displayName,
                photoURL
            })
            console.log("Document successfully written!")
        } catch (error) {
            console.error("Error writing document: ", error)
        }
    }

    return (
        <div
            className="App"
            style={{ justifyContent: auth.currentUser ? "start" : "center" }}
        >
            {auth.currentUser ? (
                <>
                    <header>
                        <button
                            className="sign-out"
                            onClick={() => signOut(auth)}
                        >
                            Sign Out
                        </button>
                    </header>
                    <section className="chats">
                        <ChatList
                            selectChat={setSelectedChat}
                            auth={auth}
                            firestore={firestore}
                        />
                        <ChatBox
                            auth={auth}
                            firestore={firestore}
                            send={sendMsg}
                            selectedChat={selectedChat}
                        />
                    </section>
                </>
            ) : (
                <button className="sign-in" onClick={signInWithGoogle}>
                    Sign in with Google
                </button>
            )}
        </div>
    )
}

export default App
