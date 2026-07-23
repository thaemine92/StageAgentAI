import { RendezVous } from '../models/RendezVous';
const MOCK_DATA: RendezVous[] = [

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
export const getAppointments = async (): Promise<RendezVous[]> => { // On trie par urgence et heure de début
  return MOCK_DATA.sort((a, b) => {
    if (a.Urgence !== b.Urgence) return a.Urgence ? -1 : 1;
    return a.heure_debut.getTime() - b.heure_debut.getTime();
  });
};

export const getAppointmentById = (id: string): RendezVous | undefined => {
  // On cherche le rendez-vous qui correspond à l'ID
  return MOCK_DATA.find((rdv) => rdv.id === id);
};