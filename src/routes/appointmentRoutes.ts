import { Router } from 'express';
import { getAppointments, getAppointmentById, getAppointmentsByPatient } from '../controllers/appointmentController';

const router = Router();

// GET /api/appointments - Tous les rendez-vous
router.get('/', async (req, res) => {
  try {
    const appointments = await getAppointments();
    res.json({ 
      success: true, 
      appointments 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des rendez-vous' 
    });
  }
});

// GET /api/appointments/:id - Un rendez-vous spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rendez-vous non trouvé' 
      });
    }
    
    res.json({ 
      success: true, 
      appointment 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du rendez-vous:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// GET /api/appointments/client/:clientId - Rendez-vous d'un client
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    // Utiliser getAppointmentsByPatient depuis le contrôleur
    const clientAppointments = await getAppointmentsByPatient(clientId);
    
    res.json({ 
      success: true, 
      appointments: clientAppointments 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous du client:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

export default router;
