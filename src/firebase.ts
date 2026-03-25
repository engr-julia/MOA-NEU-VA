import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Use initializeFirestore with the specific database ID
export const db = initializeFirestore(app, 
  { experimentalForceLongPolling: true }, 
  firebaseConfig.firestoreDatabaseId
);

// Connection test
async function testConnection() {
  try {
    // Using a path that is likely to exist or at least not trigger a permission error immediately
    // If the collection doesn't exist, it will just return null, which is fine for a connection test
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      console.log("Firestore connection test: Expected permission error (unauthenticated).");
    } else {
      console.error("Firestore connection test failed:", error);
    }
  }
}
testConnection();

export default app;
