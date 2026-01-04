import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
const apps = getApps();
let adminApp;

if (!apps.length) {
  try {
    // Check if running in server environment
    if (typeof window === "undefined") {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccount) {
        adminApp = initializeApp({
          credential: cert(JSON.parse(serviceAccount)),
        });
      } else {
        console.warn(
          "Firebase Admin SDK: Service account key not found. User deletion from Auth will not work."
        );
      }
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
  }
} else {
  adminApp = apps[0];
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const isAdminInitialized = !!adminApp;
