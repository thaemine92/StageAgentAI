/**
 * Représente l'identité d'un patient/utilisateur dans le système.
 * Les données sensibles sont identifiées pour une gestion sécurisée.
 */
export interface Client {
  id: string; 
  telephone: string; // (SMS/WhatsApp)
  
  // à chiffrer en base de données
  ramq: string; 
  date_naissance: Date;
  
  // Conformité et vie privée
  consentement_partage_donnees: boolean;
  
  // Métadonnées
  date_creation: Date;
}