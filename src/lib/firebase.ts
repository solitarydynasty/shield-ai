/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

let db: any = null;
let firebaseApp: any = null;

try {
  if (config && config.apiKey) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    
    // Use custom database ID from config if present
    if (config.firestoreDatabaseId) {
      db = getFirestore(firebaseApp, config.firestoreDatabaseId);
    } else {
      db = getFirestore(firebaseApp);
    }
    console.log("[ShieldAI] Firebase client initialized successfully.");
  } else {
    console.warn("[ShieldAI] Firebase credentials missing or incomplete. Using LocalStorage fallback.");
  }
} catch (error) {
  console.error("[ShieldAI] Failed to initialize Firebase. Falling back to LocalStorage.", error);
}

export { firebaseApp, db };
