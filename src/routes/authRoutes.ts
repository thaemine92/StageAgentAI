import { Router } from 'express';
import { loginUser, logoutUser, getCurrentUser, registerUser } from '../controllers/authController';

const router = Router();

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe sont requis' 
      });
    }
    
    const result = await loginUser(email, password);
    
    if (result.success) {
      res.json({ 
        success: true, 
        token: 'user-session-token',
        user: result.user 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: result.message 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la connexion' 
    });
  }
});

// Route d'enregistrement
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, ...additionalData } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, mot de passe et rôle sont requis' 
      });
    }
    
    if (role !== 'MEDECIN' && role !== 'CLIENT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Rôle invalide. Doit être MEDECIN ou CLIENT' 
      });
    }
    
    const result = await registerUser(email, password, role, additionalData);
    
    if (result.success) {
      res.status(201).json({ 
        success: true, 
        message: result.message,
        user: result.user 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.message 
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de l\'enregistrement' 
    });
  }
});

// Route de réinitialisation du mot de passe (à implémenter)
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requis' });

    const { requestPasswordReset } = await import('../controllers/authController');
    const result = await requestPasswordReset(email);

    if (result.success) return res.json({ success: true, message: result.message });
    return res.status(500).json({ success: false, message: result.message });
  } catch (error) {
    console.error('Erreur reset-password route:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour confirmer la réinitialisation (token + nouveau mot de passe)
router.post('/reset-password/confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token et nouveau mot de passe requis' });

    const { confirmPasswordReset } = await import('../controllers/authController');
    const result = await confirmPasswordReset(token, newPassword);

    if (result.success) return res.json({ success: true, message: result.message });
    return res.status(400).json({ success: false, message: result.message });
  } catch (error) {
    console.error('Erreur reset-password confirm route:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les informations de l'utilisateur courant
router.get('/me', (req, res) => {
  const user = getCurrentUser();
  
  if (user) {
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom
      },
    });
  } else {
    res.status(401).json({
      authenticated: false,
      message: 'Non authentifié'
    });
  }
});

// Route de déconnexion
router.post('/logout', (req, res) => {
  logoutUser();
  res.json({ 
    success: true, 
    message: 'Déconnexion réussie' 
  });
});

export default router;