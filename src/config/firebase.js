// import admin from "firebase-admin"
// import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
//  export default admin

import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

const app = initializeApp({
  credential: cert(serviceAccount),
});

const messaging = getMessaging(app);

export { app, messaging };