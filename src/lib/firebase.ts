import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB6LU_c_H4gDQWUodDVJcDEBxiuzapOksw",
  authDomain: "el-taller-delmaestro-karpinter.firebaseapp.com",
  projectId: "el-taller-delmaestro-karpinter",
  storageBucket: "el-taller-delmaestro-karpinter.firebasestorage.app",
  messagingSenderId: "270714689832",
  appId: "1:270714689832:web:34d7107a426243feb3d81d"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };
export default app;


