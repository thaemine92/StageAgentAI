export interface CompteProfessionnel {
  id: string;
  nom_entite: string;
  email: string;
  mot_de_passe_hash: string;
  type_activite: string;
  disponibilite: Date;
  mode_urgence_actif: boolean;
}