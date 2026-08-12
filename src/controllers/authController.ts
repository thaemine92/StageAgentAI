import { getDatabase } from '../database/db';
import { verifyPassword } from '../utils/passwordUtils';
import { CompteProfessionnel } from '../models/CompteProfessionnel';
import { Client } from '../models/Clients';

interface UserSession {
  id: string;
  email: string;
  role: 'MEDECIN' | 'CLIENT';
  nom?: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  user?: UserSession;
}

export interface ValidateLoginResult {
  success: boolean;
  redirectTo: string;
  error?: string;
  user?: UserSession;
}

export const loginUser = async (email: string, password: string): Promise<LoginResult> => {
  console.log("Tentative de connexion pour :", email);
  
  try {
    const db = await getDatabase();
    
    // Vérifier d'abord chez les médecins
    const medecin = await db.get(
      'SELECT id, email, nom_entite, mot_de_passe_hash FROM comptes_professionnels WHERE email = ?',
      [email]
    );
    
    if (medecin) {
      const isValid = await verifyPassword(password, medecin.mot_de_passe_hash);
      if (isValid) {
        const user: UserSession = {
          id: medecin.id,
          email: medecin.email,
          role: 'MEDECIN',
          nom: medecin.nom_entite
        };
        
        // Stocker en localStorage pour la session (côté client uniquement)
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem("userToken", JSON.stringify(user));
        }
        
        return { 
          success: true, 
          message: "Connexion réussie en tant que médecin", 
          user 
        };
      }
    }
    
    // Vérifier chez les clients
    const client = await db.get(
      'SELECT id, email, mot_de_passe_hash FROM clients WHERE email = ?',
      [email]
    );
    
    if (client) {
      const isValid = await verifyPassword(password, client.mot_de_passe_hash);
      if (isValid) {
        const user: UserSession = {
          id: client.id,
          email: client.email,
          role: 'CLIENT'
        };
        
        // Stocker en localStorage pour la session (côté client uniquement)
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem("userToken", JSON.stringify(user));
        }
        
        return { 
          success: true, 
          message: "Connexion réussie en tant que client", 
          user 
        };
      }
    }
    
    // Aucun utilisateur trouvé ou mot de passe incorrect
    return { 
      success: false, 
      message: "Identifiants invalides - email ou mot de passe incorrect"
    };
    
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return { 
      success: false, 
      message: "Erreur lors de la connexion. Veuillez réessayer."
    };
  }
};

export const logoutUser = () => {
  console.log("Déconnexion de l'utilisateur...");
  localStorage.removeItem("userToken");
  return { success: true };
};

export const getCurrentUser = (): UserSession | null => {
  const token = localStorage.getItem("userToken");
  if (token) {
    try {
      return JSON.parse(token) as UserSession;
    } catch {
      return null;
    }
  }
  return null;
};

export const validateAndLogin = async (
  email: string, 
  password: string, 
  role: 'MEDECIN' | 'CLIENT'
): Promise<ValidateLoginResult> => {
  // Vérifier que le rôle correspond au type d'email
  const isMedecinEmail = email.toLowerCase().includes("medecin") || 
                        email.toLowerCase().includes("docteur") ||
                        email.toLowerCase().includes("dr.");

  if (role === 'MEDECIN') {
    if (!isMedecinEmail) {
      return { 
        success: false, 
        redirectTo: '', 
        error: "Accès refusé : cet e-mail n'appartient pas à un médecin."
      };
    }
  } else {
    if (isMedecinEmail) {
      return { 
        success: false, 
        redirectTo: '', 
        error: "Accès refusé : un médecin ne peut pas se connecter sur l'espace client."
      };
    }
  }

  // Tenter la connexion avec vérification du mot de passe
  const loginResult = await loginUser(email, password);
  
  if (!loginResult.success) {
    return { 
      success: false, 
      redirectTo: '', 
      error: loginResult.message
    };
  }
  
  // Vérifier que le rôle correspond à l'utilisateur
  if (loginResult.user && loginResult.user.role !== role) {
    return { 
      success: false, 
      redirectTo: '', 
      error: `Accès refusé : vous êtes enregistré comme ${loginResult.user.role === 'MEDECIN' ? 'médecin' : 'client'}.`
    };
  }

  // Rediriger selon le rôle
  const redirectTo = role === 'MEDECIN' ? '/dashboard' : '/mon-espace';
  
  return { 
    success: true, 
    redirectTo, 
    user: loginResult.user
  };
};

export const registerUser = async (
  email: string,
  password: string,
  role: 'MEDECIN' | 'CLIENT',
  additionalData: Partial<CompteProfessionnel> | Partial<Client> = {}
): Promise<LoginResult> => {
  try {
    const db = await getDatabase();
    
    // Vérifier si l'email existe déjà
    const existingMedecin = await db.get(
      'SELECT id FROM comptes_professionnels WHERE email = ?',
      [email]
    );
    
    const existingClient = await db.get(
      'SELECT id FROM clients WHERE email = ?',
      [email]
    );
    
    if (existingMedecin || existingClient) {
      return {
        success: false,
        message: "Un utilisateur avec cet email existe déjà"
      };
    }
    
    // Hasher le mot de passe
    const { hashPassword } = await import('../utils/passwordUtils');
    const hashedPassword = await hashPassword(password);
    
    if (role === 'MEDECIN') {
      const medecinData = additionalData as Partial<CompteProfessionnel>;
      const id = `medecin-${Date.now()}`;
      
      await db.run(
        `INSERT INTO comptes_professionnels (id, nom_entite, email, mot_de_passe_hash, type_activite, disponibilite, mode_urgence_actif) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          medecinData.nom_entite || email,
          email,
          hashedPassword,
          medecinData.type_activite || 'Médecine générale',
          medecinData.disponibilite ? medecinData.disponibilite.toISOString() : new Date().toISOString(),
          medecinData.mode_urgence_actif ? 1 : 0
        ]
      );
      
      const user: UserSession = {
        id,
        email,
        role: 'MEDECIN',
        nom: medecinData.nom_entite
      };
      
      return {
        success: true,
        message: "Médecin enregistré avec succès",
        user
      };
    } else {
      const clientData = additionalData as Partial<Client>;
      const id = `client-${Date.now()}`;
      
      await db.run(
        `INSERT INTO clients (id, email, telephone, mot_de_passe_hash, ramq, date_naissance, consentement_partage_donnees) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          email,
          clientData.telephone || '',
          hashedPassword,
          clientData.ramq || '',
          clientData.date_naissance ? clientData.date_naissance.toISOString() : new Date().toISOString(),
          clientData.consentement_partage_donnees ? 1 : 0
        ]
      );
      
      const user: UserSession = {
        id,
        email,
        role: 'CLIENT'
      };
      
      return {
        success: true,
        message: "Client enregistré avec succès",
        user
      };
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    return {
      success: false,
      message: "Erreur lors de l'enregistrement. Veuillez réessayer."
    };
  }
};