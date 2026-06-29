const admin = require("firebase-admin");
import admin from "firebase-admin"
import serviceAccount from ""
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;