
import { openDB, IDBPDatabase } from 'idb';
import { Project } from './types';

const DB_NAME = 'zero_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = () => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
};

export const saveProject = async (project: Project): Promise<void> => {
  const db = await initDB();
  await db.put(STORE_NAME, { ...project, lastSaved: Date.now() });
};

export const getProject = async (id: string): Promise<Project | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const getAllProjects = async (): Promise<Project[]> => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const deleteProject = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};
