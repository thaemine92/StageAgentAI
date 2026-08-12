import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialiser la base de données
import { initializeDatabase } from './database/db';
import { initializeTables } from './database/initDb';

// Importer les routes
import appointmentRoutes from './routes/appointmentRoutes';
import serviceRoutes from './routes/serviceRoutes';
import aiRoutes from './routes/aiRoutes';
import authRoutes from './routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Middleware de gestion des erreurs
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur serveur:', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Fonction principale async pour démarrer le serveur
async function startServer() {
  try {
    // Initialiser la base de données au démarrage
    console.log('🔄 Initialisation de la base de données...');
    await initializeDatabase();
    await initializeTables();
    console.log('✅ Base de données initialisée avec succès');
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`⚡ Serveur en écoute sur http://localhost:${PORT}`);
      console.log(`🔗 Frontend: http://localhost:5173`);
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();

export default app;
