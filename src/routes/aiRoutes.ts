import { Router } from 'express';
import { handleChat, listAppointments } from '../controllers/aiController';

const router = Router();

// Route pour le chat principal
router.post('/chat', handleChat);

// Route pour lister les rendez-vous via l'IA
router.post('/appointments', listAppointments);

// Route pour obtenir les suggestions de l'IA (ex: créneaux disponibles)
router.post('/suggestions', async (req, res) => {
  try {
    const { userId, userRole, query } = req.body;
    
    // Exemple: suggérer des créneaux en fonction de la requête
    const suggestions = {
      dates: ['2026-08-11', '2026-08-12', '2026-08-13'],
      times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      services: ['Consultation générale', 'Suivi médical', 'Urgence'],
    };

    res.json({
      reply: `Voici quelques suggestions en fonction de votre demande "${query}":`,
      suggestions,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération des suggestions' });
  }
});

// Route pour vérifier la disponibilité d'un créneau
router.post('/check-availability', async (req, res) => {
  try {
    const { date, time, doctorId } = req.body;
    
    // TODO: Vérifier en base de données si le créneau est disponible
    // Pour l'instant, on simule une vérification
    const isAvailable = Math.random() > 0.3; // 70% de chance que ce soit disponible
    
    res.json({
      available: isAvailable,
      message: isAvailable 
        ? `Le créneau du ${date} à ${time} est disponible.`
        : `Désolé, le créneau du ${date} à ${time} n'est pas disponible. Veuillez choisir un autre créneau.`,
      alternatives: isAvailable ? [] : [
        { date: '2026-08-11', time: '10:00' },
        { date: '2026-08-12', time: '09:00' },
        { date: '2026-08-12', time: '14:00' },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification de disponibilité' });
  }
});

export default router;
