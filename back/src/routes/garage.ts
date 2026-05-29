import { Router, Response } from 'express';
import { requireAuth } from '../middlewares/auth';
import { AuthRequest } from '../types';
import * as garageService from '../services/garage.service';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = await garageService.getGarage(req.user!.userId);
    res.json(data);
  } catch (err: unknown) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Error al obtener cochera' });
  }
});

router.patch('/car/:playerCarId/color', async (req: AuthRequest, res: Response) => {
  const { colorHex } = req.body;
  const playerCarId = req.params.playerCarId as string;

  if (!colorHex) {
    res.status(400).json({ error: 'colorHex es requerido' });
    return;
  }

  try {
    const updated = await garageService.updateCarColor(req.user!.userId, playerCarId, colorHex);
    res.json(updated);
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error al actualizar color' });
  }
});

export default router;
