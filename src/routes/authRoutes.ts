import { Router } from 'express';

const router = Router();

// Routes d'authentification (simulées pour le test)
router.post('/login', (req, res) => {
  res.json({ success: true, token: 'test-token', user: { id: 'user1', role: 'doctor' } });
});

router.post('/register', (req, res) => {
  res.json({ success: true, message: 'Utilisateur enregistré' });
});

router.post('/reset-password', (req, res) => {
  res.json({ success: true, message: 'Mot de passe réinitialisé' });
});

router.get('/me', (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: 'user123',
      name: 'Dr. Dupont',
      role: 'doctor',
      email: 'dupont@example.com',
    },
  });
});

export default router;