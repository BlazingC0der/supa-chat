importScripts("https://www.gstatic.com/firebasejs/9.9.0/firebase-app-compat.js")
importScripts(
    "https://www.gstatic.com/firebasejs/9.9.0/firebase-messaging-compat.js"
)

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "chat-app-ca35e.firebaseapp.com",
    projectId: "chat-app-ca35e",
    storageBucket: "chat-app-ca35e.appspot.com",
    messagingSenderId: "995366670804",
    appId: "1:995366670804:web:b5t7c8355e838db6c548641",
    measurementId: "G-HHZDGQK3Z1"
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
    console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
    )
    const notificationTitle = payload.notification.title
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon
    }

    self.registration.showNotification(notificationTitle, notificationOptions)
})
