jest.mock('../../db', () => ({
  db: { query: jest.fn() },
}));

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  setupApodo,
  getProfile,
} from '../../services/auth.service';
import { db } from '../../db';

const mockQuery = db.query as jest.Mock;

function resetQuery(...responses: Array<{ rows: unknown[] }>) {
  let call = 0;
  mockQuery.mockImplementation(() => Promise.resolve(responses[call++] ?? { rows: [] }));
}

describe('registerWithEmail', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockVerifyIdToken.mockReset();
  });

  it('registers a new user and returns token + player', async () => {
    resetQuery(
      { rows: [] },
      { rows: [] },
      { rows: [{ id: 'u1', email: 'a@b.com' }] },
      { rows: [{ id: 'p1', apodo: 'Speedy', pesos: 1000, reputacion: 0, cochera_nivel: 1 }] },
      { rows: [{ id: 'car1' }] },
      { rows: [] },
    );
    const result = await registerWithEmail('a@b.com', 'pass123', 'Speedy');
    expect(result.token).toBeTruthy();
    expect(result.player.apodo).toBe('Speedy');
  });

  it('throws when email is already taken', async () => {
    resetQuery({ rows: [{ id: 'u1' }] });
    await expect(registerWithEmail('dup@b.com', 'pass', 'Nick')).rejects.toThrow('El email ya está registrado');
  });

  it('throws when apodo is already taken', async () => {
    resetQuery(
      { rows: [] },
      { rows: [{ id: 'p1' }] },
    );
    await expect(registerWithEmail('new@b.com', 'pass', 'TakenNick')).rejects.toThrow('Ese apodo ya está en uso');
  });
});

describe('loginWithEmail', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockVerifyIdToken.mockReset();
  });

  it('returns token + player + needsApodo=false on valid credentials', async () => {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('pass123', 10);

    resetQuery(
      { rows: [{ id: 'u1', email: 'a@b.com', password_hash: hash }] },
      { rows: [{ id: 'p1', apodo: 'Speedy', pesos: 1000, reputacion: 0, cochera_nivel: 1 }] },
    );

    const result = await loginWithEmail('a@b.com', 'pass123');
    expect(result.token).toBeTruthy();
    expect(result.needsApodo).toBe(false);
    expect(result.player).not.toBeNull();
  });

  it('returns needsApodo=true when player does not exist', async () => {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('pass123', 10);

    resetQuery(
      { rows: [{ id: 'u1', email: 'a@b.com', password_hash: hash }] },
      { rows: [] },
    );

    const result = await loginWithEmail('a@b.com', 'pass123');
    expect(result.needsApodo).toBe(true);
    expect(result.player).toBeNull();
  });

  it('throws when user does not exist', async () => {
    resetQuery({ rows: [] });
    await expect(loginWithEmail('nouser@b.com', 'pass')).rejects.toThrow('Email o contraseña incorrectos');
  });

  it('throws when password is wrong', async () => {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('correct', 10);

    resetQuery({ rows: [{ id: 'u1', email: 'a@b.com', password_hash: hash }] });

    await expect(loginWithEmail('a@b.com', 'wrong')).rejects.toThrow('Email o contraseña incorrectos');
  });
});

describe('loginWithGoogle', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockVerifyIdToken.mockReset();
  });

  function mockGoogle(email: string, sub: string) {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ email, sub }),
    });
  }

  it('creates a new user and returns token + needsApodo=true', async () => {
    mockGoogle('google@b.com', 'gid123');
    resetQuery(
      { rows: [] },
      { rows: [] },
      { rows: [{ id: 'u2', email: 'google@b.com' }] },
      { rows: [] },
    );

    const result = await loginWithGoogle('valid-id-token');
    expect(result.token).toBeTruthy();
    expect(result.needsApodo).toBe(true);
  });

  it('links google_id to existing email-only account', async () => {
    mockGoogle('existing@b.com', 'gid456');
    resetQuery(
      { rows: [] },
      { rows: [{ id: 'u3', email: 'existing@b.com', password_hash: null }] },
      { rows: [] },
      { rows: [] },
    );

    const result = await loginWithGoogle('valid-id-token');
    expect(result.token).toBeTruthy();
  });

  it('throws when email is already registered with a password', async () => {
    mockGoogle('pw@b.com', 'gid789');
    resetQuery(
      { rows: [] },
      { rows: [{ id: 'u4', email: 'pw@b.com', password_hash: 'somehash' }] },
    );

    await expect(loginWithGoogle('valid-id-token')).rejects.toThrow('Este email ya está registrado con contraseña');
  });

  it('returns existing user when google_id is already linked', async () => {
    mockGoogle('linked@b.com', 'gid999');
    resetQuery(
      { rows: [{ id: 'u5', email: 'linked@b.com' }] },
      { rows: [{ id: 'p5', apodo: 'Racer', pesos: 500, reputacion: 0, cochera_nivel: 1 }] },
    );

    const result = await loginWithGoogle('valid-id-token');
    expect(result.token).toBeTruthy();
    expect(result.needsApodo).toBe(false);
  });

  it('throws when Google payload has no email', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'gid000' }),
    });

    await expect(loginWithGoogle('bad-token')).rejects.toThrow('Token de Google inválido');
  });
});

describe('setupApodo', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockVerifyIdToken.mockReset();
  });

  it('creates a player and assigns starter car', async () => {
    resetQuery(
      { rows: [] },
      { rows: [] },
      { rows: [{ id: 'p1', apodo: 'NewRacer', pesos: 1000, reputacion: 0, cochera_nivel: 1 }] },
      { rows: [{ id: 'car1' }] },
      { rows: [] },
    );

    const player = await setupApodo('u1', 'NewRacer');
    expect(player.apodo).toBe('NewRacer');
  });

  it('throws when apodo is already taken', async () => {
    resetQuery({ rows: [{ id: 'p1' }] });
    await expect(setupApodo('u1', 'TakenNick')).rejects.toThrow('Ese apodo ya está en uso');
  });

  it('throws when player already has an apodo', async () => {
    resetQuery(
      { rows: [] },
      { rows: [{ id: 'p1' }] },
    );
    await expect(setupApodo('u1', 'AnyNick')).rejects.toThrow('El jugador ya tiene apodo');
  });
});

describe('getProfile', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockVerifyIdToken.mockReset();
  });

  it('returns user with player data', async () => {
    resetQuery(
      { rows: [{ id: 'u1', email: 'a@b.com' }] },
      { rows: [{ id: 'p1', apodo: 'Speedy', pesos: 1000, reputacion: 0, cochera_nivel: 1, autos: [] }] },
    );

    const result = await getProfile('u1');
    expect(result.email).toBe('a@b.com');
    expect(result.player).toBeDefined();
  });

  it('returns null player when player does not exist', async () => {
    resetQuery(
      { rows: [{ id: 'u1', email: 'a@b.com' }] },
      { rows: [] },
    );

    const result = await getProfile('u1');
    expect(result.player).toBeNull();
  });

  it('throws when user is not found', async () => {
    resetQuery({ rows: [] });
    await expect(getProfile('nonexistent')).rejects.toThrow('Usuario no encontrado');
  });
});
