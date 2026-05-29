import { db } from '../db';

export async function getGarage(userId: string) {
  const { rows: [player] } = await db.query(
    `SELECT p.id, p.apodo, p.pesos, p.reputacion, p.cochera_nivel,
            json_agg(json_build_object(
              'id', pc.id,
              'car_id', pc.car_id,
              'color_hex', pc.color_hex,
              'is_active', pc.is_active,
              'nombre', c.nombre,
              'slug', c.slug,
              'hp_base', c.hp_base,
              'peso_kg', c.peso_kg,
              'grip_base', c.grip_base,
              'imagen_url', c.imagen_url
            )) AS autos
     FROM players p
     LEFT JOIN player_cars pc ON pc.player_id = p.id
     LEFT JOIN cars c ON c.id = pc.car_id
     WHERE p.user_id = $1
     GROUP BY p.id`,
    [userId]
  );

  if (!player) throw new Error('Jugador no encontrado');
  return player;
}

export async function updateCarColor(userId: string, playerCarId: string, colorHex: string) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
    throw new Error('Color inválido. Usá formato hex #RRGGBB');
  }

  // Verificar que el auto pertenece al jugador
  const { rows: [row] } = await db.query(
    `SELECT pc.id FROM player_cars pc
     JOIN players p ON p.id = pc.player_id
     WHERE pc.id = $1 AND p.user_id = $2`,
    [playerCarId, userId]
  );

  if (!row) throw new Error('Auto no encontrado');

  const { rows: [updated] } = await db.query(
    'UPDATE player_cars SET color_hex = $1 WHERE id = $2 RETURNING id, color_hex',
    [colorHex, playerCarId]
  );

  return updated;
}
