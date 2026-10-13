# todos — back

NestJS + TypeORM + Postgres. Stocke le state de l'app (`AppState`, un document jsonb par clé) derrière une auth
mono-utilisateur (`User`, créé à la main).

## Dev local

```bash
cd ops && make up          # Postgres sur localhost:5433
cd back && cp .env.example .env   # puis DATABASE_URL=postgresql://todos:todos@localhost:5433/todos
npm install
npm run start:dev          # http://localhost:3000 — les migrations s'appliquent au démarrage
```

Créer le compte : sur la page de login du front, « Créer le compte (générer un hash) » produit l'`INSERT` à exécuter
dans la base.

## Endpoints

| Route              | Auth   | Rôle                                              |
|--------------------|--------|---------------------------------------------------|
| `POST /auth/login` | public | `{ username, password }` → `{ token }`            |
| `POST /auth/hash`  | public | `{ password }` → `{ hash }` (ne stocke rien)      |
| `GET /auth/me`     | Bearer | payload du token                                  |
| `GET /state/:key`  | Bearer | `{ value, updatedAt }` (`value: null` si absent)  |
| `PUT /state/:key`  | Bearer | `{ value, baseUpdatedAt }` → upsert, 409 si la base a changé depuis `baseUpdatedAt` |
| `GET /health`      | public | health check Render                               |
| `GET /version`     | public | `{ commit, startedAt }` — commit déployé (`RENDER_GIT_COMMIT`) |

Token en header `Authorization: Bearer` (pas de cookie) : front et back sont sur deux domaines différents et Safari/iOS
bloque les cookies tiers.

## Déploiement (Render — Web Service)

- Root directory : `back`
- Build : `npm ci && npm run build` — Start : `npm run start:prod` — Health check : `/health`
- Variables : `DATABASE_URL` (Neon, base `todos`), `JWT_SECRET`, `FRONTEND_URL` (URL Cloudflare Pages)

Front (Cloudflare Pages) : variable `VITE_API_URL` = URL Render du back.
