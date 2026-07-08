// import admin from "firebase-admin"
// import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
//  export default admin

import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
// import serviceAccount from "./serviceAccountKey.json" with { type: "json" };
// import { initializeApp, cert } from "firebase-admin/app";
import fs from "fs";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} else {
  serviceAccount = JSON.parse(
    fs.readFileSync("./src/config/serviceAccountKey.json", "utf8")
  );
}

const app = initializeApp({
  credential: cert(serviceAccount),
});

const messaging = getMessaging(app);

export { app, messaging };