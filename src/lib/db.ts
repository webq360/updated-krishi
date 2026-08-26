import { safeLocalStorage } from './storage';

export interface QueryConstraint {
  type: 'where' | 'orderBy' | 'limit';
  field?: string;
  op?: string;
  value?: any;
  direction?: 'asc' | 'desc';
}

export interface CollectionRef {
  _type: 'collection';
  name: string;
}

export interface DocRef {
  _type: 'doc';
  collectionName: string;
  id: string;
}

export interface QueryRef {
  _type: 'query';
  collection: CollectionRef;
  constraints: QueryConstraint[];
}

export interface DocumentData {
  id: string;
  [key: string]: any;
}

export interface QuerySnapshot {
  docs: Array<{
    id: string;
    data: () => DocumentData;
    [key: string]: any;
  }>;
  empty: boolean;
  size: number;
}

export interface DocumentSnapshot {
  id: string;
  exists: () => boolean;
  data: () => DocumentData | undefined;
}

// Helpers to mimic Firestore API supporting multi-segment paths
export function collection(_dbOrNull: any, ...pathSegments: string[]): CollectionRef {
  const name = pathSegments.filter(Boolean).join('__');
  return { _type: 'collection', name };
}

export function doc(_dbOrNull: any, ...pathSegments: string[]): DocRef {
  const segments = pathSegments.filter(Boolean);
  if (segments.length === 0) {
    return { _type: 'doc', collectionName: '', id: '' };
  }
  if (segments.length === 1) {
    return { _type: 'doc', collectionName: segments[0], id: '' };
  }
  const id = segments[segments.length - 1];
  const collectionName = segments.slice(0, segments.length - 1).join('__');
  return { _type: 'doc', collectionName, id };
}

export function where(field: string, op: string, value: any): QueryConstraint {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, direction };
}

export function limit(value: number): QueryConstraint {
  return { type: 'limit', value };
}

export function query(colRef: CollectionRef | any, ...constraints: QueryConstraint[]): QueryRef {
  const validColRef: CollectionRef = colRef?._type === 'collection' ? colRef : { _type: 'collection', name: String(colRef?.name || colRef || '') };
  return {
    _type: 'query',
    collection: validColRef,
    constraints: constraints.filter(Boolean),
  };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export function increment(n: number = 1) {
  return { _type: 'increment', value: n };
}

// Helper to get auth token
function getAuthHeader(): Record<string, string> {
  const token = safeLocalStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// MongoDB REST Client Functions
export async function getDocs(target: CollectionRef | QueryRef | any): Promise<QuerySnapshot> {
  const collectionName = target?._type === 'collection' ? target.name : target?.collection?.name || String(target);
  const url = new URL(`/api/data/${collectionName}`, window.location.origin);

  if (target?._type === 'query' && Array.isArray(target.constraints)) {
    target.constraints.forEach((c: QueryConstraint) => {
      if (c.type === 'where' && c.field && c.value !== undefined) {
        url.searchParams.append(`where_${c.field}`, String(c.value));
      }
      if (c.type === 'orderBy' && c.field) {
        url.searchParams.append('sort', (c.direction === 'desc' ? '-' : '') + c.field);
      }
      if (c.type === 'limit' && c.value) {
        url.searchParams.append('limit', String(c.value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch documents from ${collectionName}: ${res.statusText}`);
  }

  const items: DocumentData[] = await res.json();
  const docs = (items || []).map((item) => ({
    id: item.id || item._id,
    ...item,
    data: () => item,
  }));

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
  };
}

export async function getDoc(docRef: DocRef): Promise<DocumentSnapshot> {
  const res = await fetch(`/api/data/${docRef.collectionName}/${docRef.id}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (res.status === 404) {
    return {
      id: docRef.id,
      exists: () => false,
      data: () => undefined,
    };
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch document: ${res.statusText}`);
  }

  const item: DocumentData = await res.json();
  return {
    id: item.id || item._id || docRef.id,
    exists: () => !!item,
    data: () => item,
  };
}

export async function addDoc(colRef: CollectionRef | any, data: any): Promise<{ id: string }> {
  const colName = colRef?._type === 'collection' ? colRef.name : String(colRef?.name || colRef);
  const res = await fetch(`/api/data/${colName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create document in ${colName}`);
  }

  const result = await res.json();
  return { id: result.id || result._id };
}

export async function setDoc(docRef: DocRef, data: any, options?: { merge?: boolean }): Promise<void> {
  const res = await fetch(`/api/data/${docRef.collectionName}/${docRef.id}`, {
    method: options?.merge ? 'PATCH' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to set document ${docRef.id}`);
  }
}

export async function updateDoc(docRef: DocRef, data: any): Promise<void> {
  const res = await fetch(`/api/data/${docRef.collectionName}/${docRef.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update document ${docRef.id}`);
  }
}

export async function deleteDoc(docRef: DocRef): Promise<void> {
  const res = await fetch(`/api/data/${docRef.collectionName}/${docRef.id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete document ${docRef.id}`);
  }
}

// Live subscription helper (Polled sync with event listener)
export function onSnapshot(
  target: CollectionRef | QueryRef | DocRef | any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): () => void {
  let isCancelled = false;

  const fetchData = async () => {
    if (isCancelled) return;
    try {
      if (target?._type === 'doc') {
        const snap = await getDoc(target as DocRef);
        if (!isCancelled) onNext(snap);
      } else {
        const snap = await getDocs(target);
        if (!isCancelled) onNext(snap);
      }
    } catch (err) {
      if (!isCancelled && onError) {
        onError(err);
      }
    }
  };

  // Immediate fetch
  fetchData();

  // Periodic polling for live real-time sync (3.5 seconds interval)
  const intervalId = setInterval(fetchData, 3500);

  // Return unsubscribe function
  return () => {
    isCancelled = true;
    clearInterval(intervalId);
  };
}

export const db = {
  collection: (name: string, ...rest: string[]) => collection(null, name, ...rest),
  doc: (col: string, ...rest: string[]) => doc(null, col, ...rest),
};

// Current Auth User helper
export function getCurrentUser() {
  try {
    const userStr = safeLocalStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function onAuthStateChanged(_auth: any, callback: (user: any) => void) {
  const user = getCurrentUser();
  callback(user);
  const handleStorage = () => {
    callback(getCurrentUser());
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

export const auth = {
  get currentUser() {
    return getCurrentUser();
  },
  signOut: async () => {
    safeLocalStorage.removeItem('authToken');
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('isAdmin');
    safeLocalStorage.removeItem('isUser');
    safeLocalStorage.removeItem('loginMethod');
  },
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType?: OperationType, path?: string | null) {
  console.error(`MongoDB Data Error [${operationType || 'OP'} on ${path || 'unknown'}]:`, error);
}

