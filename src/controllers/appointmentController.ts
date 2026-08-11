import { RendezVous } from '../models/RendezVous';

// Données mockées (à remplacer par une vraie base de données)
let MOCK_DATA: RendezVous[] = [
  { 
    id: '1', nom_patient: 'Alice Martin', compte_professionnel_id: 'doc1', 
    client_id: 'c1', referentiel_services_id: 's1', 
    heure_debut: new Date('2026-07-17T14:30:00'), statut: 'Confirmé', 
    consignes_specifiques: 'Suivi classique', Urgence: false 
  },
  { 
    id: '2', nom_patient: 'Marc Dupont', compte_professionnel_id: 'doc1', 
    client_id: 'c2', referentiel_services_id: 's1', 
    heure_debut: new Date('2026-07-17T09:00:00'), statut: 'En attente', 
    consignes_specifiques: 'Urgence dentaire', Urgence: true 
  },
  { 
    id: '3', nom_patient: 'Sophie Tremblay', compte_professionnel_id: 'doc1', 
    client_id: 'c3', referentiel_services_id: 's1', 
    heure_debut: new Date('2026-07-17T08:30:00'), statut: 'Confirmé', 
    consignes_specifiques: 'Consultation annuelle', Urgence: false 
  }
];

export const getAppointments = async (): Promise<RendezVous[]> => {
  // On trie par urgence et heure de début
  return MOCK_DATA.sort((a, b) => {
    if (a.Urgence !== b.Urgence) return a.Urgence ? -1 : 1;
    return a.heure_debut.getTime() - b.heure_debut.getTime();
  });
};

export const getAppointmentById = (id: string): RendezVous | undefined => {
  // On cherche le rendez-vous qui correspond à l'ID
  return MOCK_DATA.find((rdv) => rdv.id === id);
};

export const createAppointment = async (appointment: RendezVous): Promise<RendezVous> => {
  // Ajouter à la liste des RDV
  const newAppointment: RendezVous = {
    ...appointment,
    id: Date.now().toString(),
    statut: appointment.statut || 'En attente',
    Urgence: appointment.Urgence || false,
  };
  MOCK_DATA.push(newAppointment);
  return newAppointment;
};

export const updateAppointment = async (id: string, updates: Partial<RendezVous>): Promise<RendezVous | null> => {
  const index = MOCK_DATA.findIndex((rdv) => rdv.id === id);
  if (index === -1) return null;
  
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
  return MOCK_DATA.filter((rdv) => rdv.compte_professionnel_id === doctorId);
};

// Fonction pour obtenir les RDV d'un patient spécifique
export const getAppointmentsByPatient = async (patientId: string): Promise<RendezVous[]> => {
  return MOCK_DATA.filter((rdv) => rdv.client_id === patientId);
};