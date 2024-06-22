import { useState, useEffect } from "react"
import "./App.css"
import "firebase/firestore"
import "firebase/auth"
import ChatBox from "./chatbox"

// Import the necessary components from the v9 SDK
import { initializeApp } from "firebase/app"
import {
    getAuth,
    signInWithPopup,
    signOut,
    GoogleAuthProvider
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"

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
const app = initializeApp(firebaseConfig)
const auth = getAuth()
const firestore = getFirestore()

function App() {
    const [user, setUser] = useState(null)

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
                console.error("Error: ", errorMessage)
            })
    }

    return (
        <div className="App">
            {auth.currentUser && (
                <header>
                        <button
                            className="sign-out"
                            onClick={() => signOut(auth)}
                        >
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
                    <button className="sign-in" onClick={signInWithGoogle}>
                        Sign in with Google
                    </button>
                )}
            </section>
        </div>
    )
}

export default App
