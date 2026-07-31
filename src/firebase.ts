import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCl7MDE1zOuXmAcqc5c_xhsZu_w-2ay1Ok",
  authDomain: "owlfster.firebaseapp.com",
  projectId: "owlfster",
  storageBucket: "owlfster.firebasestorage.app",
  messagingSenderId: "240333256153",
  appId: "1:240333256153:web:b895b523d79e88656a55c8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);

