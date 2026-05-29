-- Tabla de autenticación
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),           -- NULL para usuarios de Google
  google_id   VARCHAR(255) UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfil del jugador dentro del juego
CREATE TABLE IF NOT EXISTS players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  apodo           VARCHAR(50) UNIQUE NOT NULL,
  pesos           INTEGER NOT NULL DEFAULT 500,
  reputacion      INTEGER NOT NULL DEFAULT 0,
  cochera_nivel   INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catálogo de autos disponibles en el juego
CREATE TABLE IF NOT EXISTS cars (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(50) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  hp_base     INTEGER NOT NULL,
  peso_kg     INTEGER NOT NULL,
  grip_base   INTEGER NOT NULL CHECK (grip_base BETWEEN 1 AND 10),
  imagen_url  VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Autos en posesión de cada jugador
CREATE TABLE IF NOT EXISTS player_cars (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  car_id      UUID NOT NULL REFERENCES cars(id),
  color_hex   VARCHAR(7) NOT NULL DEFAULT '#CC0000',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
