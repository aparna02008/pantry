import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

let app: any = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export async function getFirebase() {
  if (app && auth && db) {
    return { app, auth, db };
  }

  try {
    const response = await fetch("/firebase-applet-config.json");
    if (!response.ok) {
      throw new Error(`Failed to load Firebase configuration: ${response.status} ${response.statusText}`);
    }
    const config = await response.json();
    
    // Check if we already initialized
    if (getApps().length === 0) {
      app = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      });
    } else {
      app = getApp();
    }
    
    auth = getAuth(app);
    // Use custom database ID from config if present
    if (config.firestoreDatabaseId) {
      db = getFirestore(app, config.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    
    return { app, auth, db };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
}
