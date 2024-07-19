/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require("firebase-functions")
const admin = require("firebase-admin")
const { Storage } = require("@google-cloud/storage")
const cors = require("cors")({ origin: true })

admin.initializeApp()
const storage = new Storage()
const bucketName = "your-bucket-name"

exports.generateSignedUrl = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const fileName = req.body.fileName
        const options = {
            version: "v4",
            action: "read",
            expires: Date.now() + 15 * 60 * 1000 // 15 minutes
        }

        try {
            const [url] = await storage
                .bucket(bucketName)
                .file(fileName)
                .getSignedUrl(options)
            res.status(200).send({ url })
        } catch (error) {
            console.error("Error generating signed URL:", error)
            res.status(500).send("Error generating signed URL")
        }
    })
})
