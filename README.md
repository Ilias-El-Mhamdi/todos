# Entretien & Prévoyance

PWA (Vite + React + TS) listant les tâches récurrentes — quotidien → 10 ans — pour l'appartement, la voiture, la santé
physique et mentale, et la prévoyance. Les données sont stockées en base via le back, avec le `localStorage` comme cache
hors-ligne (clé `entretien.v1`).

| Dossier  | Contenu                                   | Déploiement      |
|----------|-------------------------------------------|------------------|
| `front/` | PWA React                                 | Cloudflare Pages |
| `back/`  | API NestJS + TypeORM (voir son README)    | Render           |
| `ops/`   | Postgres local (`make up`, port 5433)     | — (Neon en prod) |

## Dev local

```bash
cd ops && make up                 # Postgres
cd back && npm run start:dev      # http://localhost:3000
cd front && npm run dev           # http://localhost:5173
cd front && npm test              # tests du calcul d'échéances
```

## Front

- PWA hors-ligne : `public/sw.js` (app shell, actif seulement en build de prod — tester avec
  `npm run build && npm run preview`), `public/manifest.webmanifest`
- Synchro des données (cache local, envoi au retour du réseau, conflits) : `src/lib/syncedState.ts`
- Catalogue des tâches : `src/data/tasks.ts`
- Calcul des échéances / statuts : `src/lib/frequency.ts`

### Déploiement Cloudflare Pages

Workers & Pages → Create → Pages → Connect to Git (`todos`), puis :

- Framework preset : React (Vite) ou None — Build command : `npm run build` — Build output directory : `dist`
- Root directory (advanced) : `front`
- Variable d'environnement : `VITE_API_URL` = URL Render du back (lue au build : redéployer si elle change)

Node 24 vient de `front/.nvmrc`. `public/_headers` met les assets hashés en cache longue durée et `sw.js` en `no-cache`
pour que les mises à jour de l'app soient prises tout de suite.
