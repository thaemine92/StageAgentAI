import { Router } from 'express';
import { getServices } from '../controllers/serviceController';

const router = Router();

// L'URL sera : GET /api/services
router.get('/', getServices);

export default router;