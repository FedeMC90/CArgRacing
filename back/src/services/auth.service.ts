import { OAuth2Client } from 'google-auth-library';
import { db } from '../db';
import { config } from '../config';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';

const googleClient = new OAuth2Client(config.googleClientId);

export async function registerWithEmail(email: string, password: string, apodo: string) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('El email ya está registrado');
  }

  const apodoExists = await db.query('SELECT id FROM players WHERE apodo = $1', [apodo]);
  if (apodoExists.rows.length > 0) {
    throw new Error('Ese apodo ya está en uso');
  }

  const password_hash = await hashPassword(password);

  const { rows: [user] } = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, password_hash]
  );

  const { rows: [player] } = await db.query(
    'INSERT INTO players (user_id, apodo) VALUES ($1, $2) RETURNING id, apodo, pesos, reputacion, cochera_nivel',
    [user.id, apodo]
  );

  await assignStarterCar(player.id);

  const token = signToken({ userId: user.id, email: user.email });
  return { token, player };
}

export async function loginWithEmail(email: string, password: string) {
  const { rows: [user] } = await db.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (!user || !user.password_hash) {
    throw new Error('Email o contraseña incorrectos');
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new Error('Email o contraseña incorrectos');
  }

  const { rows: [player] } = await db.query(
    'SELECT id, apodo, pesos, reputacion, cochera_nivel FROM players WHERE user_id = $1',
    [user.id]
  );

  const token = signToken({ userId: user.id, email: user.email });
  return { token, player: player ?? null, needsApodo: !player };
}

export async function loginWithGoogle(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error('Token de Google inválido');

  const { email, sub: googleId } = payload;

  // Buscar por google_id primero, luego por email
  let user = (await db.query('SELECT id, email FROM users WHERE google_id = $1', [googleId])).rows[0];

  if (!user) {
    const byEmail = (await db.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email])).rows[0];

    if (byEmail?.password_hash) {
      throw new Error('Este email ya está registrado con contraseña');
    }

    if (byEmail) {
      // Vincular google_id a cuenta existente sin contraseña
      await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, byEmail.id]);
      user = byEmail;
    } else {
      const { rows: [newUser] } = await db.query(
        'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING id, email',
        [email, googleId]
      );
      user = newUser;
    }
  }

  const { rows: [player] } = await db.query(
    'SELECT id, apodo, pesos, reputacion, cochera_nivel FROM players WHERE user_id = $1',
    [user.id]
  );

  const token = signToken({ userId: user.id, email: user.email });
  return { token, player: player ?? null, needsApodo: !player };
}

export async function setupApodo(userId: string, apodo: string) {
  const apodoExists = await db.query('SELECT id FROM players WHERE apodo = $1', [apodo]);
  if (apodoExists.rows.length > 0) throw new Error('Ese apodo ya está en uso');

  const playerExists = await db.query('SELECT id FROM players WHERE user_id = $1', [userId]);
  if (playerExists.rows.length > 0) throw new Error('El jugador ya tiene apodo');

  const { rows: [player] } = await db.query(
    'INSERT INTO players (user_id, apodo) VALUES ($1, $2) RETURNING id, apodo, pesos, reputacion, cochera_nivel',
    [userId, apodo]
  );

  await assignStarterCar(player.id);
  return player;
}

export async function getProfile(userId: string) {
  const { rows: [user] } = await db.query('SELECT id, email FROM users WHERE id = $1', [userId]);
  if (!user) throw new Error('Usuario no encontrado');

  const { rows: [player] } = await db.query(
    `SELECT p.id, p.apodo, p.pesos, p.reputacion, p.cochera_nivel,
            json_agg(json_build_object(
              'id', pc.id, 'car_id', pc.car_id, 'color_hex', pc.color_hex,
              'is_active', pc.is_active, 'nombre', c.nombre, 'slug', c.slug
            )) AS autos
     FROM players p
     LEFT JOIN player_cars pc ON pc.player_id = p.id
     LEFT JOIN cars c ON c.id = pc.car_id
     WHERE p.user_id = $1
     GROUP BY p.id`,
    [userId]
  );

  return { ...user, player: player ?? null };
}

async function assignStarterCar(playerId: string) {
  const { rows: [car] } = await db.query("SELECT id FROM cars WHERE slug = 'renault-12'");
  if (!car) return;
  await db.query(
    'INSERT INTO player_cars (player_id, car_id) VALUES ($1, $2)',
    [playerId, car.id]
  );
}
