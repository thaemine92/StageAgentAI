export interface RendezVous {
  id: string;
  nom_patient: string;
  compte_professionnel_id: string;
  client_id: string;
  referentiel_services_id: string;
  heure_debut: Date;
  statut: string;
  consignes_specifiques: string;
  Urgence?: boolean;
}