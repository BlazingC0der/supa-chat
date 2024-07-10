import CryptoJS from "crypto-js"

export function decryptMessage(encryptedMessage) {
    const bytes = CryptoJS.AES.decrypt(
        encryptedMessage,
        import.meta.env.VITE_SERCRET_KEY
    )
    return bytes.toString(CryptoJS.enc.Utf8)
}
