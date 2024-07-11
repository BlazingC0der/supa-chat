import CryptoJS from "crypto-js"

export function decryptMessage(encryptedMessage) {
    if (!encryptedMessage) {
        return encryptedMessage
    }
    const bytes = CryptoJS.AES.decrypt(
        encryptedMessage,
        import.meta.env.VITE_SECRET_KEY
    )
    return bytes.toString(CryptoJS.enc.Utf8)
}
