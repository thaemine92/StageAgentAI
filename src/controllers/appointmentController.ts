import { RendezVous } from '../models/RendezVous';
import { getDatabase } from '../database/db';

// Fonction pour convertir une chaîne de date en objet Date
function ensureDate(dateValue: any): Date {
  if (dateValue instanceof Date) return dateValue;
  if (!dateValue || typeof dateValue !== 'string') {
    // Si null, undefined, ou pas une string, retourner une date par défaut
    return new Date();
  }
  const date = new Date(dateValue);
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    console.warn('⚠️ Date invalide, utilisation de la date actuelle:', dateValue);
    return new Date();
  }
  return date;
}

// Données mockées
let MOCK_DATA: RendezVous[] = [
  { 
    id: '1', nom_patient: 'Alice Martin', compte_professionnel_id: 'medecin-001', 
    client_id: 'client-001', referentiel_services_id: 's1', 
    heure_debut: new Date('2026-08-18T14:30:00'), statut: 'Confirmé', 
    consignes_specifiques: 'Suivi classique', Urgence: false 
  },
  { 
    id: '2', nom_patient: 'Marc Dupont', compte_professionnel_id: 'medecin-001', 
    client_id: 'client-002', referentiel_services_id: 's1', 
    heure_debut: new Date('2026-08-18T09:00:00'), statut: 'Confirmé', 
    consignes_specifiques: 'Bilan annuel', Urgence: false 
  },
  { 
    id: '3', nom_patient: 'Sophie Tremblay', compte_professionnel_id: 'medecin-001', 
    client_id: 'client-001', referentiel_services_id: 's1', 
    heure_debut: new Date('2026-08-19T10:00:00'), statut: 'Confirmé', 
    consignes_specifiques: 'Consultation standard', Urgence: false 
  }
];

// Pour l'instant, utilisons uniquement les mocks
// Les fonctions de base de données posent problème avec les colonnes
async function getAppointmentsFromDbOrMocks(): Promise<RendezVous[]> {
  return MOCK_DATA;
}

// Fonction pour filtrer les mocks par médecin
function filterByDoctor(doctorId: string): RendezVous[] {
  return MOCK_DATA.filter(rdv => rdv.compte_professionnel_id === doctorId);
}

// Fonction pour filtrer les mocks par patient
function filterByPatient(patientId: string): RendezVous[] {
  return MOCK_DATA.filter(rdv => rdv.client_id === patientId);
}

export const getAppointments = async (): Promise<RendezVous[]> => {
  // On trie par urgence et heure de début
  const appointments = await getAppointmentsFromDbOrMocks();
  return [...appointments].sort((a, b) => {
    if (a.Urgence !== b.Urgence) return a.Urgence ? -1 : 1;
    const dateA = ensureDate(a.heure_debut);
    const dateB = ensureDate(b.heure_debut);
    const timeA = dateA.getTime();
    const timeB = dateB.getTime();
    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;
    return timeA - timeB;
  });
};

export const getAppointmentById = (id: string): RendezVous | undefined => {
  // On cherche le rendez-vous qui correspond à l'ID
  return MOCK_DATA.find((rdv) => rdv.id === id);
};

export const createAppointment = async (appointment: RendezVous): Promise<RendezVous> => {
  const db = await getDatabase();
  
  // S'assurer que heure_debut est un objet Date
  const heureDebut = appointment.heure_debut instanceof Date 
    ? appointment.heure_debut 
    : new Date(appointment.heure_debut);
  
  // Formater la date pour SQLite (ISO string)
  const dateHeure = heureDebut.toISOString();
  
  // Insérer dans la base de données
  const result = await db.run(
    `INSERT INTO rendez_vous (id, client_id, compte_professionnel_id, date_heure, statut, notes, urgence)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      appointment.id || Date.now().toString(),
      appointment.client_id,
      appointment.compte_professionnel_id,
      dateHeure,
      appointment.statut || 'programmé',
      appointment.consignes_specifiques,
      appointment.Urgence ? 1 : 0
    ]
  );
  
  // Retourner le RDV avec l'ID généré
  const newAppointment: RendezVous = {
    ...appointment,
    id: appointment.id || Date.now().toString(),
    heure_debut: heureDebut,
    statut: appointment.statut || 'programmé',
    Urgence: appointment.Urgence || false,
  };
  
  // Ajouter aussi aux mocks pour compatibilité
  MOCK_DATA.push(newAppointment);
  
  return newAppointment;
};

export const updateAppointment = async (id: string, updates: Partial<RendezVous>): Promise<RendezVous | null> => {
  const index = MOCK_DATA.findIndex((rdv) => rdv.id === id);
  if (index === -1) return null;
  
  // S'assurer que heure_debut reste un Date si présent dans les mises à jour
  if (updates.heure_debut) {
    updates = {
      ...updates,
      heure_debut: updates.heure_debut instanceof Date 
        ? updates.heure_debut 
        : new Date(updates.heure_debut)
    };
  }
  
  MOCK_DATA[index] = { ...MOCK_DATA[index], ...updates };
  return MOCK_DATA[index];
};

export const deleteAppointment = async (id: string): Promise<boolean> => {
  const initialLength = MOCK_DATA.length;
  MOCK_DATA = MOCK_DATA.filter((rdv) => rdv.id !== id);
  return MOCK_DATA.length < initialLength;
};

// Fonction pour obtenir les RDV d'un médecin spécifique
export const getAppointmentsByDoctor = async (doctorId: string): Promise<RendezVous[]> => {
  const db = await getDatabase();
  
  try {
    // Récupérer les rendez-vous du médecin
    const rows = await db.all(`
      SELECT id, client_id, compte_professionnel_id, date_heure, statut, notes, urgence
      FROM rendez_vous 
      WHERE compte_professionnel_id = ?
    `, [doctorId]);
    
    // Récupérer tous les clients pour mapper les noms
    const clients = await db.all(`SELECT id, prenom, nom FROM clients`);
    const clientMap = new Map(clients.map(c => [c.id, {prenom: c.prenom, nom: c.nom}]));
    
    return rows.map(row => {
      const clientInfo = clientMap.get(row.client_id);
      const prenom = clientInfo?.prenom || '';
      const nom = clientInfo?.nom || '';
      const nomPatient = prenom && nom ? `${prenom} ${nom}` : prenom || nom || 'Patient inconnu';
      
      return {
        id: row.id,
        nom_patient: nomPatient,
        compte_professionnel_id: row.compte_professionnel_id,
        client_id: row.client_id,
        referentiel_services_id: 's1',
        heure_debut: ensureDate(row.date_heure || row.heure_debut),
        statut: row.statut || 'programmé',
        consignes_specifiques: row.notes || row.consignes_specifiques || 'Consultation standard',
        Urgence: row.urgence === 1 || row.Urgence || false
      };
    });
  } catch (error) {
    console.error('Erreur dans getAppointmentsByDoctor:', error);
    // Fallback vers les mocks
    return filterByDoctor(doctorId);
  }
};

// Fonction pour obtenir les RDV d'un patient spécifique
export const getAppointmentsByPatient = async (patientId: string): Promise<RendezVous[]> => {
  const db = await getDatabase();
  
  try {
    // Récupérer les rendez-vous du patient
    const rows = await db.all(`
      SELECT id, client_id, compte_professionnel_id, date_heure, statut, notes, urgence
      FROM rendez_vous 
      WHERE client_id = ?
    `, [patientId]);
    
    // Récupérer le client pour avoir son nom
    const client = await db.get(`SELECT prenom, nom FROM clients WHERE id = ?`, [patientId]);
    
    const prenom = client?.prenom || '';
    const nom = client?.nom || '';
    const nomPatient = prenom && nom ? `${prenom} ${nom}` : prenom || nom || 'Patient inconnu';
    
    return rows.map(row => ({
      id: row.id,
      nom_patient: nomPatient,
      compte_professionnel_id: row.compte_professionnel_id,
      client_id: row.client_id,
      referentiel_services_id: 's1',
      heure_debut: ensureDate(row.date_heure || row.heure_debut),
      statut: row.statut || 'programmé',
      consignes_specifiques: row.notes || row.consignes_specifiques || 'Consultation standard',
      Urgence: row.urgence === 1 || row.Urgence || false
    }));
  } catch (error) {
    console.error('Erreur dans getAppointmentsByPatient:', error);
    // Fallback vers les mocks
    return filterByPatient(patientId);
  }
};