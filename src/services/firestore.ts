/**
 * SIZC Firestore Multi-Tenant Database Service
 * Provides persistent Firestore integration with tenant isolation (businessId).
 */

import admin from 'firebase-admin';

let firestoreInstance: admin.firestore.Firestore | null = null;
let isInitialized = false;

/**
 * Lazy initialization of Firebase Admin Firestore
 */
export function getFirestoreDB(): admin.firestore.Firestore | null {
  if (isInitialized) return firestoreInstance;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  try {
    if (admin.apps.length === 0) {
      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('[SIZC Firestore] Initialized Firebase Admin SDK with Service Account Credentials.');
      } else if (projectId) {
        admin.initializeApp({ projectId });
        console.log('[SIZC Firestore] Initialized Firebase Admin SDK with Project ID:', projectId);
      } else {
        // App is running with local database layer
        console.log('[SIZC Firestore] Running in local/hybrid state mode (Firebase env vars not set).');
        isInitialized = true;
        return null;
      }
    }

    firestoreInstance = admin.firestore();
    isInitialized = true;
    return firestoreInstance;
  } catch (err: any) {
    console.warn('[SIZC Firestore] Firebase Admin init notice:', err.message);
    isInitialized = true;
    return null;
  }
}

/**
 * Multi-tenant safe collection helper
 */
export async function saveDocument(collectionName: string, docId: string, data: Record<string, any>): Promise<void> {
  const db = getFirestoreDB();
  if (!db) return;

  try {
    const docRef = db.collection(collectionName).doc(docId);
    await docRef.set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error(`[SIZC Firestore] Error writing to ${collectionName}/${docId}:`, err.message);
  }
}

export async function getDocument<T = any>(collectionName: string, docId: string): Promise<T | null> {
  const db = getFirestoreDB();
  if (!db) return null;

  try {
    const docSnap = await db.collection(collectionName).doc(docId).get();
    if (docSnap.exists) {
      return docSnap.data() as T;
    }
  } catch (err: any) {
    console.error(`[SIZC Firestore] Error reading ${collectionName}/${docId}:`, err.message);
  }
  return null;
}

export async function queryDocuments<T = any>(
  collectionName: string,
  businessId: string,
  extraField?: string,
  extraValue?: any
): Promise<T[]> {
  const db = getFirestoreDB();
  if (!db) return [];

  try {
    let query: admin.firestore.Query = db.collection(collectionName).where('businessId', '==', businessId);

    if (extraField && extraValue !== undefined) {
      query = query.where(extraField, '==', extraValue);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as T);
  } catch (err: any) {
    console.error(`[SIZC Firestore] Error querying ${collectionName}:`, err.message);
    return [];
  }
}

/**
 * Tenant integration subcollection persistence:
 * tenants/{tenantId}/integrations/{integrationId}
 */
export async function saveTenantIntegration(tenantId: string, integrationId: string, data: Record<string, any>): Promise<void> {
  const db = getFirestoreDB();
  if (!db) return;

  try {
    const docRef = db.collection('tenants').doc(tenantId).collection('integrations').doc(integrationId);
    await docRef.set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error(`[SIZC Firestore] Error writing to tenants/${tenantId}/integrations/${integrationId}:`, err.message);
  }
}

export async function getTenantIntegration<T = any>(tenantId: string, integrationId: string): Promise<T | null> {
  const db = getFirestoreDB();
  if (!db) return null;

  try {
    const docSnap = await db.collection('tenants').doc(tenantId).collection('integrations').doc(integrationId).get();
    if (docSnap.exists) {
      return docSnap.data() as T;
    }
  } catch (err: any) {
    console.error(`[SIZC Firestore] Error reading tenants/${tenantId}/integrations/${integrationId}:`, err.message);
  }
  return null;
}

