import { Request, Response } from 'express';
import { db } from '../config/db'; 

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await db.query('SELECT * FROM ReferentielServices');
    
    // On renvoie les données au format JSON
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des services", error });
  }
};