import { getDatabase } from '../database/db';
import { verifyPassword } from '../utils/passwordUtils';
import { CompteProfessionnel } from '../models/CompteProfessionnel';
import { Client } from '../models/Clients';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
      'SELECT id, email, mot_de_passe_hash, prenom, nom FROM clients WHERE email = ?',
      [email]
    );
    
    if (client) {
      const isValid = await verifyPassword(password, client.mot_de_passe_hash);
      if (isValid) {
        const user: UserSession = {
          id: client.id,
          email: client.email,
          role: 'CLIENT',
          nom: client.prenom && client.nom ? `${client.prenom} ${client.nom}` : undefined
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
        `INSERT INTO clients (id, email, telephone, mot_de_passe_hash, ramq, date_naissance, prenom, nom, consentement_partage_donnees) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          email,
          clientData.telephone || '',
          hashedPassword,
          clientData.ramq || '',
          clientData.date_naissance ? clientData.date_naissance.toISOString() : new Date().toISOString(),
          clientData.prenom || '',
          clientData.nom || '',
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

/**
 * Génère et envoie un token de réinitialisation si l'email existe.
 */
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const db = await getDatabase();

    // Vérifier si l'email existe chez les clients ou médecins
    const client = await db.get('SELECT id FROM clients WHERE email = ?', [email]);
    const medecin = await db.get('SELECT id FROM comptes_professionnels WHERE email = ?', [email]);

    if (!client && !medecin) {
      return { success: false, message: 'Aucun compte trouvé avec cet email.' };
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 heure

    await db.run(
      `INSERT INTO password_reset_tokens (token, email, expires_at) VALUES (?, ?, ?)`,
      [token, email, expiresAt]
    );

    // Construire le lien de réinitialisation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/confirm?token=${token}`;

    // Envoyer l'email (ou logger si pas de config SMTP)
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: (process.env.SMTP_SECURE || 'false') === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@doclinic.local',
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        text: `Pour réinitialiser votre mot de passe, cliquez sur le lien suivant: ${resetLink}`,
        html: `<p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      });
    } else {
      console.log('Reset link (no SMTP configured):', resetLink);
    }

    return { success: true, message: 'Email de réinitialisation envoyé si le compte existe.' };
  } catch (error) {
    console.error('Erreur requestPasswordReset:', error);
    return { success: false, message: 'Erreur lors de la demande de réinitialisation.' };
  }
};

/**
 * Confirme la réinitialisation de mot de passe via token et met à jour le mot de passe haché.
 */
export const confirmPasswordReset = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const db = await getDatabase();

    const row = await db.get('SELECT token, email, expires_at FROM password_reset_tokens WHERE token = ?', [token]);
    if (!row) return { success: false, message: 'Token invalide ou expiré.' };

    const expiresAt = new Date(row.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      // supprimer le token expiré
      await db.run('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
      return { success: false, message: 'Token expiré.' };
    }

    const email = row.email as string;

    // Hasher le nouveau mot de passe
    const { hashPassword } = await import('../utils/passwordUtils');
    const hashed = await hashPassword(newPassword);

    // Mettre à jour dans la table appropriée
    const updatedClient = await db.run('UPDATE clients SET mot_de_passe_hash = ? WHERE email = ?', [hashed, email]);
    await db.run('UPDATE comptes_professionnels SET mot_de_passe_hash = ? WHERE email = ?', [hashed, email]);

    // Supprimer le token
    await db.run('DELETE FROM password_reset_tokens WHERE token = ?', [token]);

    return { success: true, message: 'Mot de passe réinitialisé avec succès.' };
  } catch (error) {
    console.error('Erreur confirmPasswordReset:', error);
    return { success: false, message: 'Erreur lors de la réinitialisation du mot de passe.' };
  }
};