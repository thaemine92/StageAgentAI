export interface LogSysteme {
  id: string;
  client_id: string;
  compte_professionnel_id: string;
  timestamp: Date;
  type_evenement: string;
  statut: string;
  est_anonyme: boolean;
  canal_communication: string;
  temps_reponse_ms: number; // Correspond au 'Float' du diagramme
  erreur_code: string;
}