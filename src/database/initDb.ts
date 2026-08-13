import { initializeDatabase, getDatabase } from './db';

export async function initializeTables(): Promise<void> {
  const db = await initializeDatabase();

  console.log('🔄 Initialisation des tables...');

  // Créer la table des clients/patients
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telephone TEXT NOT NULL,
      mot_de_passe_hash TEXT NOT NULL,
      ramq TEXT NOT NULL,
      date_naissance TEXT NOT NULL,
      prenom TEXT,
      nom TEXT,
      consentement_partage_donnees INTEGER DEFAULT 0,
      date_creation TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Créer la table des comptes professionnels (médecins)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS comptes_professionnels (
      id TEXT PRIMARY KEY NOT NULL,
      nom_entite TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mot_de_passe_hash TEXT NOT NULL,
      type_activite TEXT NOT NULL,
      disponibilite TEXT NOT NULL,
      mode_urgence_actif INTEGER DEFAULT 0
    )
  `);

  // Créer la table des rendez-vous
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rendez_vous (
      id TEXT PRIMARY KEY NOT NULL,
      client_id TEXT NOT NULL,
      compte_professionnel_id TEXT NOT NULL,
      date_heure TEXT NOT NULL,
      statut TEXT DEFAULT 'programmé',
      notes TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (compte_professionnel_id) REFERENCES comptes_professionnels(id)
    )
  `);

  // Créer la table des logs système
  await db.exec(`
    CREATE TABLE IF NOT EXISTS logs_systeme (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Créer la table des configurations agent IA
  await db.exec(`
    CREATE TABLE IF NOT EXISTS configurations_agent_ai (
      id TEXT PRIMARY KEY NOT NULL,
      nom TEXT NOT NULL,
      description TEXT,
      parametres TEXT,
      actif INTEGER DEFAULT 1
    )
  `);

  // Créer la table des référentiels de services
  await db.exec(`
    CREATE TABLE IF NOT EXISTS referentiels_services (
      id TEXT PRIMARY KEY NOT NULL,
      nom TEXT NOT NULL,
      description TEXT,
      prix REAL,
      duree_minutes INTEGER
    )
  `);

  // Créer la table des tokens de réinitialisation de mot de passe
  await db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `);

  console.log('✅ Toutes les tables créées avec succès');

  // Insérer des données de test si les tables sont vides
  await insertTestData();
}

async function insertTestData(): Promise<void> {
  const db = await getDatabase();

  // Vérifier si des clients existent déjà
  const clientsCount = await db.get('SELECT COUNT(*) as count FROM clients');
  const medecinsCount = await db.get('SELECT COUNT(*) as count FROM comptes_professionnels');

  if (clientsCount.count === 0) {
    // Insérer des clients de test
    await db.run(`
      INSERT INTO clients (id, email, telephone, mot_de_passe_hash, ramq, date_naissance, prenom, nom, consentement_partage_donnees)
      VALUES 
        ('client-001', 'patient1@email.com', '+1234567890', '$2b$10$huKenuDHm.Rab9FbLj8po.quG.a1C0suD91zXJtEz3ViicsImWx1G', 'RAMQ001', '1985-05-15', 'Alice', 'Martin', 1),
        ('client-002', 'patient2@email.com', '+1234567891', '$2b$10$huKenuDHm.Rab9FbLj8po.quG.a1C0suD91zXJtEz3ViicsImWx1G', 'RAMQ002', '1990-08-20', 'Marc', 'Dupont', 1)
    `);
    console.log('📝 Données de test clients insérées');
  }

  if (medecinsCount.count === 0) {
    // Insérer des médecins de test (mot de passe: password123 hashé)
    // Hash pour "password123" : $2b$10$huKenuDHm.Rab9FbLj8po.quG.a1C0suD91zXJtEz3ViicsImWx1G
    // Hash pour "123456" : $2b$10$huKenuDHm.Rab9FbLj8po.quG.a1C0suD91zXJtEz3ViicsImWx1G (simplifié pour test)
    await db.run(`
      INSERT INTO comptes_professionnels (id, nom_entite, email, mot_de_passe_hash, type_activite, disponibilite, mode_urgence_actif)
      VALUES 
        ('medecin-001', 'Dr. Martin Dupont', 'dr.dupont@doclinic.com', '$2b$10$huKenuDHm.Rab9FbLj8po.quG.a1C0suD91zXJtEz3ViicsImWx1G', 'Médecine générale', '2026-08-11T09:00:00', 1),
        ('medecin-002', 'Dr. Marie Tremblay', 'dr.tremblay@doclinic.com', '$2b$10$huKenuDHm.Rab9FbLj8po.quG.a1C0suD91zXJtEz3ViicsImWx1G', 'Cardiologie', '2026-08-11T10:00:00', 0)
    `);
    console.log('📝 Données de test médecins insérées');
  }
}

export async function resetDatabase(): Promise<void> {
  const db = await initializeDatabase();
  
  console.log('Réinitialisation de la base de données...');
  
  await db.exec(`
    DROP TABLE IF EXISTS rendez_vous;
    DROP TABLE IF EXISTS clients;
    DROP TABLE IF EXISTS comptes_professionnels;
    DROP TABLE IF EXISTS logs_systeme;
    DROP TABLE IF EXISTS configurations_agent_ai;
    DROP TABLE IF EXISTS referentiels_services;
  `);

  await initializeTables();
  console.log('Base de données réinitialisée');
}
