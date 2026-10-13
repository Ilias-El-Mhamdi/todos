# Entretien & Prévoyance

App locale (Vite + React + TS) listant les tâches récurrentes — quotidien → 10 ans — pour l'appartement, la voiture, la santé physique et mentale, et la prévoyance. Les données sont stockées en base via le back (`back/`, voir son README), avec le `localStorage` comme cache hors-ligne (clé `entretien.v1`).

```bash
npm install
npm run dev     # http://localhost:5173 (back attendu sur http://localhost:3000, ou VITE_API_URL)
npm test        # tests du calcul d'échéances
```

- PWA hors-ligne : `public/sw.js` (app shell, actif seulement en build de prod — tester avec `npm run build && npm run preview`), `public/manifest.webmanifest`
- Synchro des données (cache local, envoi au retour du réseau, conflits) : `src/lib/syncedState.ts`
- Catalogue des tâches : `src/data/tasks.ts`
- Calcul des échéances / statuts : `src/lib/frequency.ts`
