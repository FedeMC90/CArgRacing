import { Router, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { requireAuth } from '../middlewares/auth';
import { AuthRequest } from '../types';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, apodo } = req.body;
  if (!email || !password || !apodo) {
    res.status(400).json({ error: 'email, password y apodo son requeridos' });
    return;
  }
  try {
    const data = await authService.registerWithEmail(email, password, apodo);
    res.status(201).json(data);
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error al registrar' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email y password son requeridos' });
    return;
  }
  try {
    const data = await authService.loginWithEmail(email, password);
    res.json(data);
  } catch (err: unknown) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'Error al iniciar sesión' });
  }
});

router.post('/google', async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: 'idToken es requerido' });
    return;
  }
  try {
    const data = await authService.loginWithGoogle(idToken);
    res.json(data);
  } catch (err: unknown) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'Error con Google' });
  }
});

router.post('/apodo', requireAuth, async (req: AuthRequest, res: Response) => {
  const { apodo } = req.body;
  if (!apodo) {
    res.status(400).json({ error: 'apodo es requerido' });
    return;
  }
  try {
    const player = await authService.setupApodo(req.user!.userId, apodo);
    res.status(201).json({ player });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error al guardar apodo' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await authService.getProfile(req.user!.userId);
    res.json(data);
  } catch (err: unknown) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Error al obtener perfil' });
  }
});

export default router;
