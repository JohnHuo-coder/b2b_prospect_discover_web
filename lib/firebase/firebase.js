import { cert, getApps, initializeApp } from "firebase-admin/app";

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
  }
}

if (!getApps().length) {
  try {
    const serviceAccount = parseServiceAccount();

    if (!serviceAccount.project_id) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not properly configured"
      );
    }

    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
    throw error;
  }
}
