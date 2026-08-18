import { Client } from '../models/Clients';

// Données mockées pour les clients (patients)
let MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    email: 'alice.martin@email.com',
    telephone: '+1234567890',
    mot_de_passe_hash: 'hashed_password_1',
    prenom: 'Alice',
    nom: 'Martin',
    ramq: 'MART12345678',
    date_naissance: new Date('1985-05-15'),
    age: 41,
    maladie: 'Hypertension',
    traitement: 'Lisinopril 10mg',
    antecedents_medicaux: 'Aucun antécédent chirurgical',
    allergies: 'Pénicilline',
    consentement_partage_donnees: true,
    date_creation: new Date('2025-01-10')
  },
  {
    id: 'c2',
    email: 'marc.dupont@email.com',
    telephone: '+1987654321',
    mot_de_passe_hash: 'hashed_password_2',
    prenom: 'Marc',
    nom: 'Dupont',
    ramq: 'DUPO87654321',
    date_naissance: new Date('1978-11-22'),
    age: 47,
    maladie: 'Diabète de type 2',
    traitement: 'Metformine 500mg',
    antecedents_medicaux: 'Appendicectomie en 2005',
    allergies: 'Aucune',
    consentement_partage_donnees: true,
    date_creation: new Date('2025-02-15')
  },
  {
    id: 'c3',
    email: 'sophie.tremblay@email.com',
    telephone: '+1555123456',
    mot_de_passe_hash: 'hashed_password_3',
    prenom: 'Sophie',
    nom: 'Tremblay',
    ramq: 'TREM55512345',
    date_naissance: new Date('1990-03-10'),
    age: 36,
    maladie: 'Asthme',
    traitement: 'Ventolin inhalateur',
    antecedents_medicaux: 'Aucun',
    allergies: 'Pollen, acariens',
    consentement_partage_donnees: true,
    date_creation: new Date('2025-03-20')
  },
  {
    id: 'c4',
    email: 'john.doe@email.com',
    telephone: '+1123456789',
    mot_de_passe_hash: 'hashed_password_4',
    prenom: 'John',
    nom: 'Doe',
    ramq: 'DOE11122233',
    date_naissance: new Date('1982-07-30'),
    age: 44,
    maladie: 'Migraines chroniques',
    traitement: 'Sumatriptan 50mg',
    antecedents_medicaux: 'Migraines depuis l adolescence',
    allergies: 'Chocolat',
    consentement_partage_donnees: false,
    date_creation: new Date('2025-04-05')
  }
];

// Fonction pour obtenir tous les clients
export const getAllClients = async (): Promise<Client[]> => {
  return MOCK_CLIENTS;
};

// Fonction pour obtenir un client par son ID
export const getClientById = async (id: string): Promise<Client | undefined> => {
  return MOCK_CLIENTS.find(client => client.id === id);
};

// Fonction pour obtenir les clients d'un médecin spécifique
// (ceux qui ont un RDV avec ce médecin)
export const getClientsByDoctor = async (doctorId: string): Promise<Client[]> => {
  // Import dynamique pour éviter la dépendance circulaire
  const { getAppointmentsByDoctor } = await import('./appointmentController');
  
  const appointments = await getAppointmentsByDoctor(doctorId);
  const clientIds = appointments.map(app => app.client_id);
  
  // Filtrer et retourner les clients uniques
  const uniqueClientIds = [...new Set(clientIds)];
  return MOCK_CLIENTS.filter(client => uniqueClientIds.includes(client.id));
};

// Fonction pour obtenir les informations d'un client avec ses RDV
export const getClientWithAppointments = async (clientId: string) => {
  const client = await getClientById(clientId);
  if (!client) return null;
  
  // Import dynamique
  const { getAppointmentsByPatient } = await import('./appointmentController');
  const appointments = await getAppointmentsByPatient(clientId);
  
  return {
    ...client,
    rendez_vous: appointments
  };
};

// Fonction pour créer un client
export const createClient = async (clientData: Omit<Client, 'id' | 'date_creation'>): Promise<Client> => {
  const newClient: Client = {
    ...clientData,
    id: Date.now().toString(),
    date_creation: new Date(),
    age: clientData.date_naissance ? 
      new Date().getFullYear() - clientData.date_naissance.getFullYear() : undefined
  };
  MOCK_CLIENTS.push(newClient);
  return newClient;
};

// Fonction pour mettre à jour un client
export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client | null> => {
  const index = MOCK_CLIENTS.findIndex(client => client.id === id);
  if (index === -1) return null;
  
  MOCK_CLIENTS[index] = { ...MOCK_CLIENTS[index], ...updates };
  return MOCK_CLIENTS[index];
};
