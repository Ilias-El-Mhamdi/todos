# Entretien & Prévoyance

App locale (Vite + React + TS) listant les tâches récurrentes — quotidien → 10 ans — pour l'appartement, la voiture, la santé physique et mentale, et la prévoyance. Les dates de réalisation sont stockées dans le `localStorage` du navigateur (clé `entretien.v1`).

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # tests du calcul d'échéances
```

- Catalogue des tâches : `src/data/tasks.ts`
- Calcul des échéances / statuts : `src/lib/frequency.ts`
