// Version frontend-only des fonctions d'authentification
// Utilise uniquement localStorage (compatible navigateur)

export interface UserSession {
  id: string;
  email: string;
  role: 'MEDECIN' | 'CLIENT';
  nom?: string;
}

/**
 * Récupère l'utilisateur connecté depuis localStorage
 * Retourne null si non connecté
 */
export const getCurrentUser = (): UserSession | null => {
  if (typeof window === 'undefined') return null; // SSR safety
  
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

/**
 * Déconnecte l'utilisateur (supprime le token localStorage)
 */
export const logoutUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem("userToken");
  }
  return { success: true };
};
