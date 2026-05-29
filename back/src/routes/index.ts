import { Router } from 'express';
import authRouter from './auth';
import garageRouter from './garage';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/garage', garageRouter);

export default router;
