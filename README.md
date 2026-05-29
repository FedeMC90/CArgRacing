# CArgRacing

Juego mobile de autos estilo Street Rod ambientado en Argentina. Pixel art con autos y escenarios típicos argentinos.

---

## Estructura del proyecto

```
CArgRacing/
├── front/                    # Next.js 16 + React 19 + TypeScript + Tailwind v4
├── back/                     # Node.js + Express 4 + TypeScript + PostgreSQL
│   └── src/
│       ├── config/           # Variables de entorno
│       ├── db/
│       │   └── migrations/
│       │       └── sql/      # Archivos .sql numerados (001_, 002_, ...)
│       ├── middlewares/      # Auth JWT
│       ├── routes/           # Rutas Express
│       ├── services/         # Lógica de negocio
│       ├── types/            # Tipos TypeScript compartidos
│       └── utils/            # JWT, bcrypt helpers
├── docker-compose.yml
└── README.md
```

---

## Base de datos

**Motor:** PostgreSQL 16 (vía Docker)

| Parámetro | Valor          |
|-----------|----------------|
| Host      | localhost      |
| Puerto    | 5432           |
| Nombre    | cargracing     |
| Usuario   | postgres       |
| Password  | cargracing123  |

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `migrations` | Control de migraciones aplicadas (se crea sola) |
| `users` | Credenciales de autenticación (email/pass o Google) |
| `players` | Perfil del jugador: apodo, pesos, reputación, nivel de cochera |
| `cars` | Catálogo de autos disponibles en el juego |
| `player_cars` | Autos en posesión de cada jugador |

Las migraciones corren automáticamente al iniciar el servidor. Los SQL viven en `back/src/db/migrations/sql/`.

### Autos en catálogo

| Slug | Nombre | HP base | Peso |
|------|--------|---------|------|
| `renault-12` | Renault 12 | 62 | 895 kg |

---

## Requisitos

- [Node.js](https://nodejs.org/) v20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Cómo levantar el entorno

### 1. Base de datos

```bash
docker-compose up -d
```

Para detenerla (los datos persisten):
```bash
docker-compose down
```

Para detenerla y **borrar todos los datos**:
```bash
docker-compose down -v
```

### 2. Backend

```bash
cd back
npm install
npm run dev
```

Corre en `http://localhost:3001`. Las migraciones y el seed de autos se ejecutan solos al arrancar.

### 3. Frontend

```bash
cd front
npm install
npm run dev
```

Corre en `http://localhost:3000`

---

## Variables de entorno

### back/.env

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=cargracing
DB_USER=postgres
DB_PASSWORD=cargracing123

JWT_SECRET=cargracing_dev_secret_2026
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=        # Obtener en Google Cloud Console
```

### front/.env.local (crear manualmente)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Tests

```bash
cd back
npm test                    # corre todos los tests
npm test -- --coverage      # con reporte de cobertura
```

**Cobertura actual:** 99.47% statements · 83.67% branches · 100% functions · 100% lines  
**Suite:** 7 archivos · 59 tests · todos en verde

Tests en `back/src/__tests__/`:
- `utils/` → jwt, password
- `middlewares/` → auth (requireAuth)
- `services/` → auth.service, garage.service
- `routes/` → auth, garage (vía supertest)

---

## API — Endpoints implementados

### Auth

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Registro con email, password y apodo | No |
| `POST` | `/api/auth/login` | Login con email y password | No |
| `POST` | `/api/auth/google` | Login/registro con Google ID token | No |
| `POST` | `/api/auth/apodo` | Elegir apodo (usuarios nuevos de Google) | JWT |
| `GET`  | `/api/auth/me` | Perfil completo del jugador | JWT |
| `GET`  | `/api/health` | Estado del servidor | No |

### Garage

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/garage` | Estado completo de la cochera (player + autos con stats) | JWT |
| `PATCH`| `/api/garage/car/:playerCarId/color` | Actualizar color de pintura `{ colorHex: "#RRGGBB" }` | JWT |

### Flujo de registro

**Email/password:**
```
POST /api/auth/register  { email, password, apodo }
→ { token, player }
```

**Google:**
```
POST /api/auth/google  { idToken }
→ { token, player, needsApodo: true/false }

Si needsApodo === true:
POST /api/auth/apodo  { apodo }  + Bearer token
→ { player }
```

---

## Procesamiento de imágenes

Para remover el fondo gris de las imágenes de autos generadas por IA:

```bash
cd back
npx ts-node scripts/remove-bg.ts ../front/public/assets/cars/renault-12.png
```

Poné las imágenes originales en `front/public/assets/cars/` y el script genera el PNG con fondo transparente en el mismo lugar.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4 |
| Juego | Phaser.js 3 (embebido en Next.js, carga dinámica sin SSR) |
| Mobile (futuro) | Capacitor |
| Backend | Node.js, Express 4, TypeScript |
| Auth | JWT (jsonwebtoken) + bcrypt + Google OAuth |
| Base datos | PostgreSQL 16 |
| Dev DB | Docker + docker-compose |
| Testing | Jest + ts-jest + supertest |

---

## Estructura del front

```
front/
├── app/
│   ├── login/page.tsx          # Login + registro
│   ├── setup-apodo/page.tsx    # Elegir apodo (usuarios Google)
│   └── garage/page.tsx         # Cochera principal
├── components/
│   └── PhaserGarage.tsx        # Canvas Phaser (carga dinámica, sin SSR)
├── lib/
│   ├── api.ts                  # Cliente HTTP (fetch + JWT automático)
│   ├── auth.ts                 # Helpers localStorage token
│   └── phaser/
│       └── GarageScene.ts      # Escena Phaser de la cochera
└── public/
    └── assets/
        └── cars/               # PNGs de autos (con fondo transparente)
```

---

## Hoja de ruta

- [x] **Checkpoint 1** — Fundación: DB schema, migraciones, auth completo (email + Google + JWT)
- [x] **Checkpoint 2** — La cochera: Phaser.js integrado, garage endpoint, color de pintura, login/registro UI
- [ ] **Checkpoint 3** — La primera picada: mecánica de timing, cálculo de resultado en servidor
- [ ] **Checkpoint 4** — Progresión: upgrades, rivales, tienda
- [ ] **Checkpoint 5** — Mobile: Capacitor, build Android/iOS
