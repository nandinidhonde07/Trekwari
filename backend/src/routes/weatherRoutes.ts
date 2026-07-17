import { Router } from 'express';
import { getTrekWeather } from '../controllers/weatherController';

const router = Router();

router.get('/', getTrekWeather);

export default router;
