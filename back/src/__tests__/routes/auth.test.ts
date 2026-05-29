import request from 'supertest';
import app from '../../app';
import * as authService from '../../services/auth.service';
import { signToken } from '../../utils/jwt';

jest.mock('../../services/auth.service');

const mockRegister = authService.registerWithEmail as jest.Mock;
const mockLogin = authService.loginWithEmail as jest.Mock;
const mockGoogle = authService.loginWithGoogle as jest.Mock;
const mockSetupApodo = authService.setupApodo as jest.Mock;
const mockGetProfile = authService.getProfile as jest.Mock;

const fakePlayer = { id: 'p1', apodo: 'Speedy', pesos: 1000, reputacion: 0, cochera_nivel: 1 };
const fakeToken = signToken({ userId: 'u1', email: 'a@b.com' });

beforeEach(() => jest.clearAllMocks());

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/auth/register', () => {
  it('returns 201 with token and player on success', async () => {
    mockRegister.mockResolvedValue({ token: fakeToken, player: fakePlayer });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'pass123', apodo: 'Speedy' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBe(fakeToken);
    expect(res.body.player.apodo).toBe('Speedy');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 400 when service throws', async () => {
    mockRegister.mockRejectedValue(new Error('El email ya está registrado'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@b.com', password: 'pass', apodo: 'Nick' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El email ya está registrado');
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with token on success', async () => {
    mockLogin.mockResolvedValue({ token: fakeToken, player: fakePlayer, needsApodo: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe(fakeToken);
    expect(res.body.needsApodo).toBe(false);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com' });

    expect(res.status).toBe(400);
  });

  it('returns 401 when service throws', async () => {
    mockLogin.mockRejectedValue(new Error('Email o contraseña incorrectos'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email o contraseña incorrectos');
  });
});

describe('POST /api/auth/google', () => {
  it('returns 200 with token on success', async () => {
    mockGoogle.mockResolvedValue({ token: fakeToken, player: fakePlayer, needsApodo: false });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe(fakeToken);
  });

  it('returns 400 when idToken is missing', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 401 when service throws', async () => {
    mockGoogle.mockRejectedValue(new Error('Token de Google inválido'));

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'bad-token' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token de Google inválido');
  });
});

describe('POST /api/auth/apodo', () => {
  it('returns 201 with player on success', async () => {
    mockSetupApodo.mockResolvedValue(fakePlayer);

    const res = await request(app)
      .post('/api/auth/apodo')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({ apodo: 'Speedy' });

    expect(res.status).toBe(201);
    expect(res.body.player.apodo).toBe('Speedy');
  });

  it('returns 400 when apodo is missing', async () => {
    const res = await request(app)
      .post('/api/auth/apodo')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 401 when no auth token', async () => {
    const res = await request(app)
      .post('/api/auth/apodo')
      .send({ apodo: 'Speedy' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when service throws', async () => {
    mockSetupApodo.mockRejectedValue(new Error('Ese apodo ya está en uso'));

    const res = await request(app)
      .post('/api/auth/apodo')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({ apodo: 'TakenNick' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ese apodo ya está en uso');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 200 with user and player on success', async () => {
    mockGetProfile.mockResolvedValue({ id: 'u1', email: 'a@b.com', player: fakePlayer });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@b.com');
    expect(res.body.player).toBeDefined();
  });

  it('returns 401 when no auth token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 404 when service throws', async () => {
    mockGetProfile.mockRejectedValue(new Error('Usuario no encontrado'));

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Usuario no encontrado');
  });
});
