import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Chemin vers la base de données SQLite
// Utiliser process.cwd() pour obtenir la racine du projet
const projectRoot = process.cwd();
const DB_PATH = path.join(projectRoot, 'data', 'doclinic.db');

// Afficher le chemin pour débogage
console.log('📁 Chemin de la base de données:', DB_PATH);

// Initialisation de la base de données
let db: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  // Ouvrir la connexion à la base de données
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  console.log('✅ Base de données SQLite connectée à:', DB_PATH);

  return db;
}

export async function getDatabase(): Promise<Database> {
  if (!db) {
    throw new Error('Base de données non initialisée. Appelez initializeDatabase() d\'abord.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('🔌 Base de données SQLite déconnectée');
  }
}

export { db };
