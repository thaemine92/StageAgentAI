import { CompteProfessionnel } from '../models/CompteProfessionnel';

export const loginUser = async (email: string, mdp: string) => {
  console.log("Tentative de connexion pour :", email);
  
  if (email === "admin@doclinic.com" && mdp === "123456") {
    return { 
      success: true, 
      message: "Connexion réussie", 
      user: { email: "admin@doclinic.com", role: "admin" } 
    };
  }
  return { 
    success: false, 
    message: "Identifiants invalides" 
  };
};

export const logoutUser = () => {
  console.log("Déconnexion de l'utilisateur...");
  localStorage.removeItem("userToken"); // on utilise localStorage pour stocker le token de l'utilisateur le temps d'avoir une bdd
  return { success: true };
};

export const validateAndLogin = (email: string, role: 'MEDECIN' | 'CLIENT'): { success: boolean; redirectTo: string; error?: string } => {
  const isMedecinEmail = email.toLowerCase().includes("medecin") || email.toLowerCase().includes("docteur");

  if (role === 'MEDECIN') {
    if (!isMedecinEmail) {
      return { success: false, redirectTo: '', error: "Accès refusé : cet e-mail n'appartient pas à un médecin." };
    }
    return { success: true, redirectTo: '/dashboard' };
  } else {
    if (isMedecinEmail) {
      return { success: false, redirectTo: '', error: "Accès refusé : un médecin ne peut pas se connecter sur l'espace client." };
    }
    return { success: true, redirectTo: '/mon-espace' };
  }
};