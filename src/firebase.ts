import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Improved initialization for environments with connectivity issues
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Connectivity Test with retry logic
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const testDoc = doc(db, 'test', 'connection');
      await getDocFromServer(testDoc);
      console.log("Firestore connection check: [OK]");
      return;
    } catch (error) {
      const isUnavailable = error instanceof Error && (error.message.includes('unavailable') || error.message.includes('offline'));
      if (isUnavailable && i < retries - 1) {
        console.warn(`Firestore unavailable, retrying in ${Math.pow(2, i)}s...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      
      if (isUnavailable) {
        console.error("Firestore connection failed after retries. This may be due to platform network restrictions or provisioning delays.");
      } else {
        console.error("Firestore connectivity test error:", error);
      }
      break;
    }
  }
}
testConnection();

try {
  setPersistence(auth, browserLocalPersistence).catch(err => console.error("Auth persistence error:", err));
} catch (e) {
  console.warn("Auth persistence setting failed", e);
}

// Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: any[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  try {
    console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  } catch (e) {
    console.error('Firestore Error (Raw):', errInfo);
  }
}
