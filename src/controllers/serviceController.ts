import { Request, Response } from 'express';
import { getDatabase } from '../database/db';

export const getServices = async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const services = await db.all('SELECT * FROM referentiels_services');
    
    // On renvoie les données au format JSON
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des services", error });
  }
};