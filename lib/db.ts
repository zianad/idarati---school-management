
import { School } from '../types/index.ts';

const DB_NAME = 'IdaratiDB';
const DB_VERSION = 1;
const SCHOOLS_STORE_NAME = 'schools';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SCHOOLS_STORE_NAME)) {
        db.createObjectStore(SCHOOLS_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getAllSchools = (): Promise<School[]> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(SCHOOLS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SCHOOLS_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

export const putSchool = (school: School): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(SCHOOLS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SCHOOLS_STORE_NAME);
    const request = store.put(school);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const deleteSchoolDB = (schoolId: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(SCHOOLS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SCHOOLS_STORE_NAME);
    const request = store.delete(schoolId);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const bulkPutSchools = (schools: School[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await initDB();
        const transaction = db.transaction(SCHOOLS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(SCHOOLS_STORE_NAME);

        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => {
            reject(transaction.error);
        };

        schools.forEach(school => {
            store.put(school);
        });
    });
};

export const clearSchools = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await initDB();
        const transaction = db.transaction(SCHOOLS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(SCHOOLS_STORE_NAME);
        const request = store.clear();

        request.onerror = () => {
            reject(request.error);
        };
        request.onsuccess = () => {
            resolve();
        };
    });
};
