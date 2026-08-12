import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash un mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Erreur lors du hashage du mot de passe:', error);
    throw new Error('Impossible de hasher le mot de passe');
  }
}

/**
 * Vérifie si un mot de passe correspond à son hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error);
    return false;
  }
}

/**
 * Génère un ID unique
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
