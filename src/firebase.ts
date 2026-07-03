import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, authInstance: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authInstance?.currentUser?.uid || null,
      email: authInstance?.currentUser?.email || null,
      emailVerified: authInstance?.currentUser?.emailVerified || null,
      isAnonymous: authInstance?.currentUser?.isAnonymous || null,
      tenantId: authInstance?.currentUser?.tenantId || null,
      providerInfo: authInstance?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Function to validate and get saved config
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  const saved = localStorage.getItem('omni_firebase_config');
  if (!saved) return null;
  try {
    const config = JSON.parse(saved);
    if (config.apiKey && config.projectId && config.appId) {
      return config as FirebaseConfig;
    }
  } catch (e) {
    console.error('Failed to parse saved Firebase config', e);
  }
  return null;
}

// Function to save Firebase config to localStorage
export function saveFirebaseConfig(config: FirebaseConfig | null) {
  if (config) {
    localStorage.setItem('omni_firebase_config', JSON.stringify(config));
  } else {
    localStorage.removeItem('omni_firebase_config');
  }
}

// Function to get active Firebase service instances dynamically
export function getFirebaseServices() {
  const config = getSavedFirebaseConfig();
  if (!config) return { app: null, db: null, auth: null };

  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);
    return { app, db, auth };
  } catch (error) {
    console.error('Error initializing Firebase services:', error);
    return { app: null, db: null, auth: null };
  }
}
