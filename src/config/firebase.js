// import admin from "firebase-admin"
// import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
//  export default admin

import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
// import serviceAccount from "./serviceAccountKey.json" with { type: "json" };
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

serviceAccount.private_key =
  serviceAccount.private_key.replace(/\\n/g, "\n");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = getMessaging(app);

export { app, messaging };