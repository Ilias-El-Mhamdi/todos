export type Category =
  | 'appartement'
  | 'voiture'
  | 'sante-physique'
  | 'sante-mentale'
  | 'relations'
  | 'carriere'
  | 'numerique'
  | 'garde-robe'
  | 'prevoyance'
  | 'business'
  | 'hygiene'
  | 'travaux'
  | 'autre'

export type Frequency =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'fixed'
  | 'annual'
  | 'biennial'
  | '3y'
  | '5y'
  | '10y'
  | 'trigger'

export interface Subtask {
  id: string
  group: string
  title: string
}

export interface Task {
  id: string
  title: string
  category: Category
  frequency: Frequency
  note?: string
  /** For 'fixed' tasks: calendar dates as MM-DD. */
  dates?: string[]
  /** Mileage interval: due at whichever comes first, date or km. */
  km?: number
  subtasks?: Subtask[]
  /** 1 (highest) to 5. */
  priority?: Priority
}

export type Priority = 1 | 2 | 3 | 4 | 5

export const PRIORITIES: Priority[] = [1, 2, 3, 4, 5]

export const CATEGORIES: Record<Category, { label: string; icon: string }> = {
  appartement: { label: 'Appartement', icon: '🏠' },
  voiture: { label: 'Voiture', icon: '🚗' },
  'sante-physique': { label: 'Santé physique', icon: '💪' },
  'sante-mentale': { label: 'Santé mentale', icon: '🧠' },
  relations: { label: 'Relations & famille', icon: '👥' },
  carriere: { label: 'Carrière & formation', icon: '💼' },
  numerique: { label: 'Numérique', icon: '💻' },
  'garde-robe': { label: 'Garde-robe', icon: '👕' },
  prevoyance: { label: 'Prévoyance', icon: '🛡️' },
  business: { label: 'Business', icon: '🏢' },
  hygiene: { label: 'Hygiène & soins', icon: '🪥' },
  travaux: { label: 'Travaux', icon: '🔨' },
  autre: { label: 'Autre', icon: '📌' },
}

export const FREQUENCIES: Record<Frequency, string> = {
  once: 'Mise en place',
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  biweekly: 'Toutes les 2 semaines',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  semiannual: 'Semestriel',
  fixed: 'À date fixe',
  annual: 'Annuel',
  biennial: 'Tous les 2 ans',
  '3y': 'Tous les 3 ans',
  '5y': 'Tous les 5 ans',
  '10y': 'Tous les 10 ans',
  trigger: 'Checklists',
}

type Extra = Pick<Task, 'dates' | 'km'>
type Row = [id: string, category: Category, title: string, note?: string, extra?: Extra]

const CATALOG: Record<Frequency, Row[]> = {
  once: [
    ['backup-321', 'numerique', 'Mettre en place un backup 3-2-1', 'Time Machine sur disque externe + sauvegarde cloud chiffrée (Backblaze, iCloud…) + 1 copie hors du domicile.'],
    ['password-manager', 'numerique', 'Gestionnaire de mots de passe + 2FA partout', 'Imprimer les codes de secours et les ranger avec les papiers importants.'],
    ['device-security', 'numerique', 'Chiffrement disque (FileVault) + « Localiser » activé sur tous les appareils'],
    ['digital-vault', 'prevoyance', 'Coffre-fort numérique des papiers', 'Scans : CNI, passeport, permis, carte grise, bail, contrats, fiches de paie, diplômes.'],
    ['emergency-fund', 'prevoyance', 'Épargne de précaution + virement automatique', 'Cible : 3 à 6 mois de dépenses sur un livret disponible.'],
    ['ice-contacts', 'prevoyance', "Fiche médicale d'urgence + contacts ICE sur le téléphone", 'Vérifier aussi Carte Vitale et carte de mutuelle à jour.'],
    ['emergency-kit', 'prevoyance', "Trousse de premiers secours + kit d'urgence", 'Lampe, piles, eau, radio, copies des papiers, chargeur externe.'],
    ['coverage-check', 'prevoyance', 'Vérifier ses couvertures', 'Mutuelle, prévoyance/décès, responsabilité civile, garantie accidents de la vie.'],
    ['fire-safety', 'appartement', 'Extincteur cuisine + couverture anti-feu + détecteur de fumée', 'Le détecteur de fumée (DAAF) est obligatoire.'],
    ['valves', 'appartement', "Repérer vanne d'eau, gaz et disjoncteur"],
    ['inventory', 'appartement', "Photos / inventaire des biens pour l'assurance", 'Sans ticket : relevés bancaires, emails de commande, historique des comptes marchands, photo du n° de série.'],
    ['spare-keys', 'appartement', 'Double des clés chez un proche de confiance'],
    ['car-log', 'voiture', "Tenir un carnet d'entretien", 'Kilométrage, dates, factures de chaque intervention.'],
    ['car-safety-kit', 'voiture', 'Gilet + triangle dans la voiture', 'Obligatoires en France.'],
    ['gp-declared', 'sante-physique', 'Déclarer un médecin traitant', 'Sans médecin traitant, les consultations sont moins bien remboursées.'],
    ['ergonomics', 'sante-physique', 'Poste de travail ergonomique', 'Haut de l’écran à hauteur des yeux, pieds à plat, lumière latérale, pauses toutes les heures.'],
    ['psc1', 'prevoyance', 'Formation premiers secours (PSC1)', 'Une journée, ~60 € (Croix-Rouge, Protection civile, pompiers).'],
    ['biz-bank', 'business', 'Compte bancaire dédié à l’activité', 'Facilite la compta et le rapprochement ; toutes les recettes et dépenses pro passent par lui.'],
    ['biz-invoice-mentions', 'business', 'Modèle de facture conforme + CGV', 'SIREN, n° TVA intracom, date d’échéance, pénalités de retard, indemnité forfaitaire de 40 €.'],
    ['biz-einvoicing', 'business', 'Choisir une plateforme agréée pour la facturation électronique', 'Réception obligatoire depuis le 1er sept. 2026 ; émission obligatoire pour les micro/PME au 1er sept. 2027.'],
    ['biz-rcpro', 'business', 'Souscrire une RC Pro adaptée à l’activité'],
    ['biz-tax-reserve', 'business', 'Compte épargne « provisions » pour impôt, cotisations et TVA', 'Virer à chaque encaissement la part qui ne t’appartient pas.'],
    ['biz-pro-space', 'business', 'Accès aux espaces en ligne : impots.gouv pro, URSSAF, guichet unique (INPI)'],
    ['car-booster', 'voiture', 'Acheter un booster de démarrage', 'Booster lithium 12 V (~500 A suffit pour un 1.3 essence) : démarre seul, sans seconde voiture. À défaut, des câbles.'],
    ['crit-air', 'voiture', 'Commander la vignette Crit’Air', 'Obligatoire dans les ZFE (Grand Paris…). Yaris 2006 essence = Crit’Air 2. Uniquement sur certificat-air.gouv.fr.'],
    ['car-assistance', 'voiture', 'Vérifier l’assistance dépannage et enregistrer son numéro', 'Souvent incluse dans l’assurance auto : vérifier le kilométrage « 0 km » (panne devant chez soi).'],
    ['car-constat', 'voiture', 'Constat amiable vierge + stylo dans la boîte à gants', 'Ou l’application e-constat auto.'],
    ['car-papers', 'voiture', 'Photos de la carte grise, du permis et de l’attestation d’assurance dans le téléphone'],
    ['car-spare-key', 'voiture', 'Double des clés + pile de télécommande de rechange'],
    ['car-trunk-kit', 'voiture', 'Constituer le kit de coffre'],
    ['car-snow', 'voiture', 'Équipements neige si trajets en montagne', 'Loi Montagne : chaînes/chaussettes ou pneus hiver obligatoires du 1er nov. au 31 mars dans les zones concernées.'],
  ],
  daily: [
    ['dishes', 'appartement', 'Vaisselle / vider le lave-vaisselle'],
    ['counters', 'appartement', 'Essuyer plan de travail et plaques'],
    ['air', 'appartement', 'Aérer 10 minutes'],
    ['bed', 'appartement', 'Faire le lit'],
    ['tidy', 'appartement', 'Rangement express 10 minutes'],
    ['shower-squeegee', 'appartement', 'Raclette sur la douche + aérer la salle de bain', 'Prévient les moisissures.'],
    ['sleep', 'sante-physique', 'Dormir 7 à 9 h, horaires réguliers'],
    ['water', 'sante-physique', "Boire 1,5 à 2 L d'eau"],
    ['activity', 'sante-physique', "30 min d'activité / 7 000 à 10 000 pas"],
    ['stretch', 'sante-physique', "10 min d'étirements / mobilité"],
    ['teeth', 'hygiene', 'Brossage des dents 2× + fil dentaire'],
    ['veggies', 'sante-physique', '5 fruits et légumes'],
    ['meditate', 'sante-mentale', '10 min de respiration / méditation'],
    ['gratitude', 'sante-mentale', '3 gratitudes ou quelques lignes de journal'],
    ['screen-off', 'sante-mentale', "Pas d'écran 30 à 60 min avant le coucher"],
    ['agenda', 'prevoyance', 'Consulter agenda et tâches du jour'],
    ['shower', 'hygiene', 'Douche'],
    ['skincare', 'hygiene', 'Soin visage : nettoyer + hydrater', 'Le matin, crème avec SPF si exposition au soleil.'],
  ],
  weekly: [
    ['vacuum', 'appartement', 'Aspirateur + serpillière'],
    ['dust', 'appartement', 'Dépoussiérer les surfaces'],
    ['bathroom', 'appartement', 'Salle de bain : lavabo, WC, douche, miroir'],
    ['sheets', 'appartement', 'Changer draps et serviettes'],
    ['laundry', 'appartement', 'Lessives'],
    ['fridge-check', 'appartement', 'Frigo : jeter le périmé, essuyer les clayettes sales'],
    ['microwave', 'appartement', 'Nettoyer le micro-ondes'],
    ['trash', 'appartement', 'Sortir et trier toutes les poubelles', 'Recyclage, verre, déchets alimentaires.'],
    ['balcony', 'appartement', 'Balcon : arroser les plantes, balayer'],
    ['car-glance', 'voiture', "Coup d'œil pneus et voyants, vider l'habitacle"],
    ['exercise', 'sante-physique', '150 min d’activité modérée dont 2 séances de renforcement', 'Recommandation OMS.'],
    ['meal-plan', 'sante-physique', 'Planifier les repas et les courses'],
    ['hobby', 'sante-mentale', 'Temps dédié à un hobby'],
    ['nature', 'sante-mentale', 'Sortie nature / marche sans téléphone'],
    ['screen-time', 'sante-mentale', 'Revue du temps d’écran de la semaine (téléphone, réseaux sociaux)', 'Réglages > Temps d’écran ; fixer des limites sur les apps qui débordent.'],
    ['social', 'relations', 'Voir ou appeler un proche'],
    ['parents', 'relations', 'Appeler les parents / la famille'],
    ['weekly-review', 'prevoyance', 'Revue hebdo : budget de la semaine, planning, tâches'],
    ['backup-check', 'numerique', 'Vérifier que les backups automatiques ont tourné'],
    ['updates', 'numerique', 'Installer les mises à jour OS / apps'],
    ['biz-invoicing', 'business', 'Émettre les factures et relancer les impayés'],
    ['biz-receipts', 'business', 'Saisir recettes et dépenses, scanner les justificatifs', 'Livre-journal des recettes et dépenses (BNC : comptabilité de trésorerie).'],
    ['biz-prospecting', 'business', 'Prospection / suivi du pipeline commercial'],
    ['nails-hands', 'hygiene', 'Couper / limer les ongles des mains'],
    ['beard', 'hygiene', 'Tailler la barbe / se raser', 'Masquer si non concerné.'],
    ['ears', 'hygiene', 'Nettoyer les oreilles', 'Pavillon seulement : pas de coton-tige dans le conduit.'],
    ['phone-clean', 'hygiene', 'Désinfecter téléphone, écouteurs, clavier et souris', 'Parmi les objets les plus sales du quotidien.'],
    ['lunch-gear', 'hygiene', 'Laver à fond gourde, tasse et boîtes repas', 'Goupillon pour la gourde, joints démontés.'],
  ],
  biweekly: [
    ['kitchen-textiles', 'appartement', 'Laver torchons, tapis de bain, plaids'],
    ['bathroom-deep', 'appartement', 'Salle de bain à fond : joints, bonde, sous le lavabo'],
    ['plants-feed', 'appartement', 'Engrais pour les plantes du balcon', 'D’avril à septembre seulement.'],
    ['car-wash', 'voiture', 'Lavage extérieur + aspirateur intérieur'],
    ['friends', 'relations', 'Voir des amis'],
    ['batch-cooking', 'sante-physique', 'Batch cooking : préparer plusieurs repas d’avance'],
    ['nails-feet', 'hygiene', 'Couper les ongles des pieds', 'Bien droit, pour éviter les ongles incarnés.'],
    ['scrub', 'hygiene', 'Gommage visage / corps'],
    ['feet-care', 'hygiene', 'Soin des pieds : pierre ponce + crème hydratante'],
  ],
  monthly: [
    ['dishwasher-filter', 'appartement', 'Nettoyer le filtre du lave-vaisselle'],
    ['washing-machine', 'appartement', 'Machine à laver : joint, filtre, cycle à vide 60–90 °C'],
    ['descale-small', 'appartement', 'Détartrer bouilloire et pommeau de douche'],
    ['hood-grease', 'appartement', 'Nettoyer les grilles de hotte'],
    ['drains', 'appartement', 'Siphons évier / lavabo / douche', 'Eau bouillante, ou bicarbonate + vinaigre.'],
    ['smoke-test', 'appartement', 'Tester le détecteur de fumée'],
    ['dust-high', 'appartement', 'Dépoussiérer luminaires, plinthes, dessus de meubles'],
    ['bin-clean', 'appartement', 'Nettoyer la poubelle'],
    ['cellar', 'appartement', 'Passage à la cave : humidité, nuisibles, rangement'],
    ['pantry', 'appartement', 'Inventaire des placards alimentaires (dates, stocks)'],
    ['meters', 'appartement', 'Relever les compteurs (électricité, eau, gaz)', 'Détecte une fuite ou un appareil qui consomme anormalement.'],
    ['odometer', 'voiture', 'Mettre à jour le kilométrage dans l’app', 'Sert à calculer vidange, bougies et boîte auto au kilométrage.'],
    ['tire-pressure', 'voiture', 'Pression des pneus à froid (+ roue de secours)', 'Valeurs sur l’étiquette de la portière conducteur.'],
    ['oil-level', 'voiture', "Niveau d'huile moteur"],
    ['washer-fluid', 'voiture', 'Niveau de lave-glace'],
    ['lights', 'voiture', 'Tester tous les feux'],
    ['car-drive', 'voiture', 'Rouler au moins 20 min si la voiture sert peu', 'Recharge la batterie, évite les pneus déformés et les freins grippés.'],
    ['skin-check', 'sante-physique', 'Auto-examen de la peau et auto-palpation'],
    ['mood-review', 'sante-mentale', 'Bilan humeur / énergie / sommeil du mois'],
    ['new-experience', 'sante-mentale', 'Une nouvelle expérience ou sortie culturelle'],
    ['learning', 'carriere', 'Temps de veille / formation (cours, lecture, conférence)'],
    ['shoes-polish', 'garde-robe', 'Entretenir les chaussures (cirage, imperméabilisant)'],
    ['budget', 'prevoyance', 'Budget mensuel : relevés, prélèvements, abonnements'],
    ['paperwork', 'prevoyance', 'Classer / scanner les papiers reçus'],
    ['restore-file', 'numerique', 'Restaurer un fichier au hasard depuis le backup'],
    ['phone-backup', 'numerique', 'Sauvegarder le téléphone (photos, messages)'],
    ['photos-sort', 'numerique', 'Trier les photos du mois'],
    ['breaches', 'numerique', 'Vérifier les fuites de données (haveibeenpwned.com)'],
    ['digital-tidy', 'numerique', 'Ranger Téléchargements / Bureau'],
    ['biz-bank-reconciliation', 'business', 'Rapprochement bancaire (compte pro vs compta)'],
    ['biz-vat-ca3', 'business', 'Déclaration et paiement de TVA (CA3)', 'Régime réel normal. Si tu es au régime simplifié (CA12 annuelle), masque cette tâche.'],
    ['biz-urssaf', 'business', 'Vérifier le prélèvement URSSAF du mois', 'Si ton revenu varie fortement, ajuster le revenu estimé pour moduler les acomptes.'],
    ['biz-provisions', 'business', 'Virer les provisions impôt / cotisations / TVA sur le compte épargne'],
    ['biz-mileage', 'business', 'Reporter les trajets pro (barème kilométrique)', 'Date, trajet, km, motif : justifie les frais de véhicule.'],
    ['haircut', 'hygiene', 'Coiffeur', 'Toutes les 4 à 6 semaines selon la coupe.'],
    ['razor-blades', 'hygiene', 'Changer les lames de rasoir'],
    ['hairbrush-clean', 'hygiene', 'Nettoyer brosse, peigne et tondeuse'],
    ['grooming-details', 'hygiene', 'Sourcils, poils de nez et d’oreilles (tondeuse)'],
    ['shower-puff', 'hygiene', 'Remplacer fleur de douche / laver les gants de toilette', 'Les bactéries s’y développent vite dans l’humidité.'],
  ],
  quarterly: [
    ['windows', 'appartement', 'Vitres, cadres et rails de fenêtres'],
    ['vents', 'appartement', 'Bouches de VMC / aérations'],
    ['silicone-clean', 'appartement', 'Joints silicone de la salle de bain (anti-moisissure)'],
    ['descale-taps', 'appartement', 'Détartrer robinets, aérateurs et WC'],
    ['oven', 'appartement', 'Nettoyer le four à fond'],
    ['fridge-deep', 'appartement', 'Intérieur du frigo complet'],
    ['freezer', 'appartement', 'Dégivrer le congélateur', 'Inutile si no-frost.'],
    ['mattress-flip', 'appartement', 'Retourner et aspirer le matelas'],
    ['balcony-deep', 'appartement', "Balcon à fond : sol, garde-corps, évacuation d'eau"],
    ['coolant-level', 'voiture', 'Niveau liquide de refroidissement'],
    ['brake-level', 'voiture', 'Niveau liquide de frein'],
    ['atf-level', 'voiture', 'Huile de boîte auto : niveau, couleur, odeur', 'À chaud, moteur tournant, levier sur P. Rouge clair = OK, brun/odeur de brûlé = garage.'],
    ['wipers-check', 'voiture', 'État des essuie-glaces'],
    ['car-interior', 'voiture', 'Nettoyage intérieur complet (vitres, plastiques, tapis)'],
    ['toothbrush', 'hygiene', 'Changer la brosse à dents'],
    ['sport-review', 'sante-physique', 'Bilan de progression sport'],
    ['quarter-goals', 'sante-mentale', 'Bilan des objectifs du trimestre'],
    ['day-off', 'sante-mentale', 'Journée off / micro-vacances'],
    ['declutter', 'sante-mentale', 'Désencombrer vêtements et objets'],
    ['career-review', 'carriere', 'Bilan pro : ce que j’ai appris, ce que je veux'],
    ['restore-full', 'numerique', 'Test de restauration complet d’un backup'],
    ['app-permissions', 'numerique', 'Revoir les permissions des apps (localisation, micro, photos)'],
    ['unused-accounts', 'numerique', 'Supprimer les comptes en ligne inutilisés'],
    ['subscriptions', 'prevoyance', 'Revue des abonnements à résilier'],
    ['emergency-fund-check', 'prevoyance', "Vérifier le niveau de l'épargne de précaution"],
    ['kit-check', 'prevoyance', "Vérifier / compléter trousse de secours et kit d'urgence"],
    ['biz-review', 'business', 'Revue business : CA, charges, marge, pipeline, objectifs'],
    ['biz-subscriptions', 'business', 'Revue des abonnements et logiciels pro'],
    ['cosmetics-expiry', 'hygiene', 'Trier les produits de soin périmés', 'Repère la durée après ouverture (pot ouvert « 12M »).'],
    ['booster-charge', 'voiture', 'Recharger le booster de démarrage', 'Il se décharge seul, surtout l’hiver.'],
    ['windshield', 'voiture', 'Inspecter le pare-brise : impacts à faire réparer', 'Un impact réparé tôt évite le remplacement ; souvent couvert par la garantie bris de glace.'],
  ],
  semiannual: [
    ['textiles', 'appartement', 'Laver rideaux, couette, oreillers, housses'],
    ['behind-furniture', 'appartement', 'Nettoyer derrière / sous meubles et électroménager'],
    ['fridge-coils', 'appartement', 'Dépoussiérer la grille arrière du frigo'],
    ['hood-filter', 'appartement', 'Filtre charbon de la hotte', 'À remplacer si hotte en recyclage.'],
    ['leaks', 'appartement', 'Chercher les fuites (robinets, chasse d’eau)', "Relever le compteur d'eau le soir, recontrôler le matin sans rien utiliser."],
    ['tire-wear', 'voiture', 'Usure des pneus (témoin 1,6 mm)', 'Pneus hiver / été si utilisés.'],
    ['wax', 'voiture', 'Lavage complet + cire'],
    ['car-kit-check', 'voiture', 'Vérifier le kit de coffre', 'Gilet, triangle, roue de secours gonflée, cric, piles de la lampe, trousse de secours, eau.'],
    ['dentist', 'sante-physique', 'Dentiste : contrôle + détartrage'],
    ['holidays', 'sante-mentale', 'Planifier les prochaines vacances'],
    ['relationships', 'relations', 'Bilan relationnel : qui je vois peu, qui me fait du bien'],
    ['cv', 'carriere', 'Mettre à jour CV et LinkedIn'],
    ['repairs', 'garde-robe', 'Faire réparer vêtements et chaussures (couturière, cordonnier)'],
    ['id-expiry', 'prevoyance', "Dates d'expiration : CNI, passeport, permis, carte Vitale"],
    ['router-fw', 'numerique', 'Mettre à jour firmware box / routeur'],
    ['cloud-clean', 'numerique', 'Nettoyer le stockage cloud'],
    ['travel-kit', 'hygiene', 'Refaire la trousse de toilette de voyage', 'Mini-formats, dates, brosse à dents de rechange.'],
    ['battery-terminals', 'voiture', 'Bornes de batterie : oxydation et serrage', 'Dépôt blanc/vert = nettoyer à la brosse + eau bicarbonatée, moteur coupé.'],
  ],
  fixed: [
    ['dst', 'appartement', 'Changement d’heure : horloges, piles du détecteur, kit d’urgence', 'Derniers dimanches de mars et d’octobre.', { dates: ['03-29', '10-25'] }],
    ['spring-clean', 'appartement', 'Grand ménage de printemps', 'Du haut vers le bas, pièce par pièce. Peut s’étaler sur 3–4 week-ends en mars–avril.', { dates: ['04-15'] }],
    ['radiators', 'appartement', "Purger / dépoussiérer les radiateurs avant l'hiver", undefined, { dates: ['10-01'] }],
    ['balcony-season', 'appartement', 'Balcon : rempoter et semer au printemps, hiverner les plantes à l’automne', undefined, { dates: ['04-01', '11-01'] }],
    ['winter-prep', 'voiture', 'Préparer l’hiver : antigel lave-glace, raclette, test batterie', undefined, { dates: ['10-15'] }],
    ['car-ac', 'voiture', 'Remettre la clim en route et vérifier qu’elle refroidit', 'La faire tourner régulièrement préserve les joints du circuit.', { dates: ['05-01'] }],
    ['wardrobe', 'garde-robe', 'Rotation garde-robe saisonnière + tri', 'Ce qui n’a pas été porté depuis un an part en don.', { dates: ['04-15', '10-15'] }],
    ['outerwear', 'garde-robe', 'Laver / imperméabiliser manteaux et doudounes avant de les ranger', undefined, { dates: ['04-01'] }],
    ['taxes', 'prevoyance', 'Déclaration d’impôts', 'Date limite en ligne entre fin mai et début juin selon le département.', { dates: ['05-20'] }],
    ['tax-notice', 'prevoyance', 'Vérifier l’avis d’imposition et le taux de prélèvement', undefined, { dates: ['09-15'] }],
    ['biz-2035', 'business', 'Déclaration de résultats BNC (liasse 2035)', 'Échéance en ligne mi-mai ; reporter ensuite le bénéfice sur la 2042-C-PRO.', { dates: ['05-15'] }],
    ['biz-ca12', 'business', 'TVA régime simplifié : CA12 et acomptes', 'Uniquement si régime simplifié : CA12 début mai, acomptes en juillet et décembre. Sinon, masquer.', { dates: ['05-05', '07-15', '12-15'] }],
    ['biz-cfe', 'business', 'Payer la CFE', 'Avis disponible uniquement dans l’espace professionnel impots.gouv (novembre).', { dates: ['12-15'] }],
    ['biz-per', 'business', 'Versement PER / prévoyance Madelin avant la fin de l’année', 'Déductible du revenu professionnel dans les limites légales.', { dates: ['12-01'] }],
    ['biz-closing', 'business', 'Clôture de l’exercice', 'Exercice civil : clôture au 31 décembre.', { dates: ['12-31'] }],
    ['biz-urssaf-regul', 'business', 'Vérifier la régularisation de cotisations URSSAF', 'Recalcul sur le revenu réel déclaré au printemps.', { dates: ['11-01'] }],
    ['biz-rates', 'business', 'Revoir ses tarifs pour la nouvelle année', undefined, { dates: ['01-15'] }],
    ['sunscreen', 'hygiene', 'Racheter de la crème solaire', 'Une crème entamée l’été dernier protège moins.', { dates: ['05-01'] }],
    ['underbody-wash', 'voiture', 'Laver bas de caisse et passages de roue après l’hiver', 'Enlève le sel de déneigement, qui accélère la rouille.', { dates: ['03-15'] }],
    ['door-seals', 'voiture', 'Silicone sur les joints de portières et de coffre', 'Évite que les portes collent par le gel.', { dates: ['11-01'] }],
  ],
  annual: [
    ['boiler', 'appartement', 'Entretien de la chaudière', 'Obligatoire si chaudière gaz individuelle — masquer sinon.'],
    ['window-seals', 'appartement', 'Vérifier les joints de fenêtres'],
    ['energy-review', 'appartement', 'Comparer la consommation d’énergie à l’année précédente'],
    ['home-insurance', 'appartement', "Attestation d'assurance habitation", 'À fournir au bailleur si locataire.'],
    ['inventory-update', 'appartement', "Mettre à jour l'inventaire photo des biens"],
    ['service', 'voiture', 'Révision : vidange huile + filtre, filtre à air, filtre habitacle', 'Tous les ans ou 15 000 km, au premier atteint.', { km: 15_000 }],
    ['garage-check', 'voiture', 'Contrôle plaquettes / disques, rotules, échappement, fuites'],
    ['wipers', 'voiture', 'Remplacer les essuie-glaces'],
    ['alignment', 'voiture', 'Contrôler le parallélisme'],
    ['car-insurance', 'voiture', "Comparer l'assurance auto", 'Voiture de 20 ans : peser tiers vs tous risques.'],
    ['gp', 'sante-physique', 'Médecin généraliste : bilan, tension, poids'],
    ['derm', 'sante-physique', 'Dermatologue', 'Surtout si nombreux grains de beauté ou facteurs de risque.'],
    ['vaccines', 'sante-physique', 'Vérifier le carnet de vaccination'],
    ['hearing', 'sante-physique', 'Contrôle auditif', 'Surtout en cas d’écoute fréquente au casque ou de concerts.'],
    ['sti', 'sante-physique', 'Dépistage IST (selon situation)', 'Possible sans ordonnance en laboratoire.'],
    ['year-review', 'sante-mentale', "Bilan de l'année et objectifs"],
    ['real-holidays', 'sante-mentale', 'Vraies vacances déconnectées'],
    ['psy-checkin', 'sante-mentale', 'Point avec un psy en prévention', 'Dispositif « Mon soutien psy » : séances remboursées sur orientation ou en accès direct.'],
    ['birthdays', 'relations', 'Mettre à jour les anniversaires dans l’agenda'],
    ['trip-loved-ones', 'relations', 'Un voyage ou un week-end avec des proches'],
    ['giving', 'relations', 'Dons / bénévolat', 'Dons aux associations : 66 % déductibles de l’impôt (75 % pour l’aide aux personnes en difficulté, dans la limite d’un plafond).'],
    ['appraisal', 'carriere', 'Préparer l’entretien annuel (réalisations, objectifs, demandes)'],
    ['salary', 'carriere', 'Comparer sa rémunération au marché'],
    ['network', 'carriere', 'Entretenir son réseau (café avec d’anciens collègues)'],
    ['cpf', 'carriere', 'Vérifier et utiliser les droits CPF'],
    ['connected-devices', 'numerique', 'Vérifier appareils et sessions connectés (Google, Apple, banque)'],
    ['password-audit', 'numerique', 'Audit du gestionnaire : mots de passe faibles ou réutilisés'],
    ['insurance-review', 'prevoyance', 'Revoir assurances : habitation, auto, mutuelle, prévoyance'],
    ['contracts', 'prevoyance', 'Comparer contrats énergie / télécom / banque'],
    ['wealth', 'prevoyance', 'Bilan patrimoine / épargne (livrets, PEA, assurance-vie, PER)', 'Vérifier les bénéficiaires de l’assurance-vie.'],
    ['archive', 'prevoyance', 'Archiver les papiers selon les durées de conservation'],
    ['meds', 'prevoyance', 'Jeter les médicaments périmés (en pharmacie)'],
    ['biz-rcpro-review', 'business', 'Revoir RC Pro et assurances pro'],
    ['biz-training', 'business', 'Financer une formation (FIF PL / CPF)', 'Les libéraux cotisent à la formation : demander la prise en charge au FIF PL.'],
    ['biz-archive', 'business', 'Archiver les pièces comptables', 'Conserver 10 ans (pièces comptables) ; 6 ans minimum pour le fisc.'],
    ['biz-renewals', 'business', 'Renouvellements : nom de domaine, hébergement, licences'],
    ['biz-accountant', 'business', 'Évaluer le besoin d’un expert-comptable / outil de compta'],
    ['tire-rotation', 'voiture', 'Permuter les pneus avant / arrière', 'Ou tous les 10 000 km : sur une traction, l’avant s’use plus vite.', { km: 10_000 }],
    ['rust-check', 'voiture', 'Inspecter la rouille : bas de caisse, passages de roue, échappement', 'Traiter tôt (antirouille) avant que ça perce.'],
    ['headlights', 'voiture', 'Rénover les optiques de phares si jaunies', 'Kit de rénovation : améliore l’éclairage et évite une remarque au CT.'],
    ['license-points', 'voiture', 'Consulter son solde de points de permis', 'Service « Mes points permis » sur permisdeconduire.ants.gouv.fr.'],
  ],
  biennial: [
    ['ct', 'voiture', 'Contrôle technique', 'Obligatoire tous les 2 ans.'],
    ['brake-fluid', 'voiture', 'Purge du liquide de frein'],
    ['eyes', 'sante-physique', 'Examen de la vue (ophtalmo / opticien)'],
    ['bloodwork', 'sante-physique', 'Bilan sanguin', 'Selon avis du médecin.'],
    ['pillows', 'appartement', 'Remplacer les oreillers'],
  ],
  '3y': [
    ['duvet', 'appartement', 'Remplacer protège-matelas et couette'],
    ['running-shoes', 'garde-robe', 'Remplacer les chaussures de sport', 'Ou ~800 km de course.'],
    ['devices-review', 'numerique', 'Évaluer ses appareils : batterie, stockage, fin des mises à jour'],
    ['psc1-refresh', 'prevoyance', 'Remise à niveau premiers secours', 'Les gestes s’oublient : refaire une session courte.'],
    ['ac-service', 'voiture', 'Entretien de la climatisation : recharge + filtre déshydratant', 'Si elle refroidit moins ; le gaz s’échappe lentement avec le temps.'],
  ],
  '5y': [
    ['coolant', 'voiture', 'Remplacer le liquide de refroidissement (Toyota SLLC)'],
    ['atf-change', 'voiture', 'Vidange de la boîte auto (ATF WS)', 'Ou 60 000 km. Vidange simple, jamais de rinçage sous pression sur une vieille boîte.', { km: 60_000 }],
    ['spark-plugs', 'voiture', "Bougies d'allumage iridium", 'Ou ~100 000 km.', { km: 100_000 }],
    ['battery', 'voiture', 'Remplacer la batterie', 'Durée de vie 4 à 5 ans.'],
    ['tires', 'voiture', 'Remplacer les pneus', 'Au plus tard ~6 ans même peu usés (date DOT sur le flanc).'],
    ['suspension', 'voiture', 'Contrôler amortisseurs et silentblocs'],
    ['timing-chain', 'voiture', 'Chaîne de distribution : contrôle bruit / tension', 'Moteur VVT-i à chaîne, pas de courroie à remplacer.'],
    ['silicone-redo', 'appartement', 'Refaire les joints silicone de la salle de bain'],
    ['shower-hose', 'appartement', 'Remplacer le flexible de douche'],
    ['cholesterol', 'sante-physique', 'Bilan lipidique / cholestérol'],
    ['screenings', 'sante-physique', "Dépistages adaptés à l'âge", 'Selon avis du médecin.'],
    ['life-review', 'sante-mentale', 'Bilan de vie et projets à 5 ans'],
    ['backup-disks', 'numerique', 'Remplacer les disques de backup et migrer les archives', 'Durée de vie 3 à 5 ans.'],
    ['career-record', 'prevoyance', 'Relevé de carrière (info-retraite.fr)'],
    ['retirement', 'prevoyance', 'Revoir stratégie retraite / patrimoine'],
    ['will', 'prevoyance', 'Testament / directives anticipées'],
    ['accessory-belt', 'voiture', 'Remplacer la courroie d’accessoires (alternateur)', 'Ou ~100 000 km, ou dès qu’elle siffle / se craquelle.', { km: 100_000 }],
  ],
  '10y': [
    ['smoke-replace', 'appartement', 'Remplacer le détecteur de fumée', 'Durée de vie 10 ans.'],
    ['mattress', 'appartement', 'Remplacer le matelas', '8 à 10 ans.'],
    ['dtp', 'sante-physique', 'Rappel vaccin dTP', 'Rappels à 25, 45 et 65 ans : prochain à 45 ans.'],
    ['id-renew', 'prevoyance', 'Renouveler CNI / passeport'],
    ['life-insurance', 'prevoyance', 'Revoir couverture prévoyance / décès', 'Selon la situation : couple, enfants, achat immobilier.'],
    ['car-replace', 'voiture', 'Évaluer le remplacement de la voiture', 'Coût des réparations vs valeur du véhicule.'],
  ],
  trigger: [
    ['before-holidays', 'appartement', 'Avant de partir en vacances'],
    ['long-drive', 'voiture', 'Avant un long trajet'],
    ['big-purchase', 'prevoyance', 'Après un achat important'],
    ['life-change', 'prevoyance', 'Changement de vie (couple, enfant, achat immobilier)'],
    ['moving', 'appartement', 'Déménagement'],
    ['biz-new-client', 'business', 'Nouveau client / nouvelle mission'],
  ],
}

type SubRow = [id: string, title: string]

const SUBTASKS: Record<string, Record<string, SubRow[]>> = {
  'spring-clean': {
    Partout: [
      ['cobwebs', 'Toiles d’araignée aux plafonds et dans les angles'],
      ['walls', 'Murs, portes, poignées, interrupteurs, prises'],
      ['frames', 'Encadrements et dessus des portes et des cadres'],
      ['radiators-deep', 'Radiateurs : intérieur et derrière'],
      ['move-furniture', 'Déplacer les meubles, nettoyer dessous et derrière'],
      ['lamps', 'Lustres et abat-jour'],
    ],
    Cuisine: [
      ['cupboards', 'Vider et laver tous les placards, jeter le périmé'],
      ['cupboard-tops', 'Dessus des placards hauts (graisse)'],
      ['splashback', 'Crédence et joints du carrelage'],
      ['small-appliances', 'Petit électroménager : grille-pain, cafetière, robot'],
      ['behind-appliances', 'Derrière lave-vaisselle / machine à laver'],
    ],
    'Salle de bain': [
      ['bath-cabinet', 'Vider l’armoire, trier cosmétiques et médicaments'],
      ['tiles', 'Carrelage et joints jusqu’au plafond'],
      ['bath-vent', 'Démonter et laver la bouche de VMC'],
      ['shower-curtain', 'Rideau de douche / tapis de bain (laver ou remplacer)'],
    ],
    Chambre: [
      ['wardrobe-empty', 'Vider l’armoire, laver les étagères, trier les vêtements'],
      ['bed-base', 'Aspirer le sommier et sous le lit'],
      ['mattress-protector', 'Laver le protège-matelas'],
    ],
    'Séjour / entrée': [
      ['sofa', 'Canapé : aspirer en profondeur, laver les housses'],
      ['books', 'Sortir et dépoussiérer les livres'],
      ['cables', 'Câbles derrière télé et bureau'],
      ['shoes', 'Meuble à chaussures, cirer les chaussures, laver le paillasson'],
    ],
    'Balcon & cave': [
      ['balcony-furniture', 'Laver le mobilier de balcon, préparer les plantes'],
      ['cellar-empty', 'Cave : tout sortir, balayer, trier, vérifier humidité'],
    ],
    Désencombrement: [
      ['papers', 'Paperasse en vrac : scanner, classer, jeter'],
      ['junk-drawer', 'Tiroir fourre-tout, câbles et chargeurs orphelins'],
      ['e-waste', 'Déposer les vieux appareils en point de collecte'],
    ],
  },
  'car-trunk-kit': {
    Sécurité: [
      ['tk-torch', 'Lampe torche (frontale idéalement) + piles'],
      ['tk-gloves', 'Gants de travail'],
      ['tk-first-aid', 'Trousse de premiers secours'],
      ['tk-blanket', 'Couverture de survie'],
    ],
    Entretien: [
      ['tk-compressor', 'Compresseur 12 V ou manomètre'],
      ['tk-wheel', 'Cric, clé de roue, clé antivol de roue : présents et utilisables'],
      ['tk-oil', '1 L d’huile moteur d’appoint (bonne viscosité)'],
      ['tk-washer', 'Bidon de lave-glace'],
      ['tk-bulbs', 'Ampoules et fusibles de rechange'],
    ],
    Confort: [
      ['tk-scraper', 'Raclette + dégivrant'],
      ['tk-charger', 'Chargeur USB et support téléphone'],
      ['tk-water', 'Bouteille d’eau'],
    ],
  },
  'before-holidays': {
    Logement: [
      ['water-off', 'Couper l’arrivée d’eau'],
      ['unplug', 'Débrancher les appareils (box, TV, multiprises)'],
      ['fridge-empty', 'Vider le frigo des produits périssables'],
      ['trash-out', 'Sortir toutes les poubelles'],
      ['windows-closed', 'Fermer fenêtres et volets, porte du balcon'],
      ['plants', 'Arroser les plantes ou les confier'],
      ['neighbour', 'Prévenir un voisin ou un proche (clés, courrier)'],
    ],
    Départ: [
      ['ooo', 'Programmer le message d’absence'],
      ['travel-docs', 'Papiers d’identité, carte Vitale / carte européenne, assurance voyage'],
      ['bank', 'Prévenir la banque si voyage à l’étranger, vérifier plafonds'],
      ['backup-before', 'Backup récent de l’ordinateur'],
    ],
  },
  'long-drive': {
    Voiture: [
      ['ld-pressure', 'Pression des pneus (valeur « charge » si chargé)'],
      ['ld-levels', 'Niveaux : huile, refroidissement, lave-glace'],
      ['ld-lights', 'Tous les feux fonctionnent'],
      ['ld-wipers', 'Essuie-glaces en bon état'],
      ['ld-fuel', 'Faire le plein'],
    ],
    'À bord': [
      ['ld-papers', 'Carte grise, attestation d’assurance, permis'],
      ['ld-kit', 'Gilet, triangle, roue de secours gonflée'],
      ['ld-phone', 'Téléphone chargé + câble, itinéraire hors-ligne'],
      ['ld-water', 'Eau et en-cas'],
    ],
  },
  'big-purchase': {
    Preuves: [
      ['bp-invoice', 'Scanner la facture dans le coffre-fort numérique'],
      ['bp-serial', 'Photo du produit et du numéro de série'],
      ['bp-inventory', 'Ajouter à l’inventaire des biens'],
    ],
    Garantie: [
      ['bp-warranty', 'Noter la date de fin de garantie (2 ans légale minimum)'],
      ['bp-register', 'Enregistrer le produit chez le fabricant'],
      ['bp-insurance', 'Vérifier le plafond « objets de valeur » de l’assurance'],
    ],
  },
  'life-change': {
    Contrats: [
      ['lc-beneficiaries', 'Bénéficiaires assurance-vie et contrats prévoyance'],
      ['lc-home-car', 'Assurances habitation et auto'],
      ['lc-mutuelle', 'Mutuelle : ajouter les ayants droit'],
      ['lc-coverage', 'Revoir couverture décès / invalidité'],
    ],
    Administratif: [
      ['lc-taxes', 'Situation fiscale (impots.gouv.fr)'],
      ['lc-caf', 'CAF / Sécurité sociale'],
      ['lc-will', 'Testament, donation, régime matrimonial / PACS'],
      ['lc-emergency', 'Contacts d’urgence et fiche ICE'],
    ],
  },
  'biz-closing': {
    'Avant le 31/12': [
      ['cl-unpaid', 'Relancer les factures impayées (BNC : seules les sommes encaissées comptent)'],
      ['cl-expenses', 'Régler les dépenses déductibles prévues'],
      ['cl-per', 'Versement PER / Madelin si prévu'],
    ],
    Clôture: [
      ['cl-bank', 'Relevé bancaire au 31/12 et rapprochement final'],
      ['cl-assets', 'Registre des immobilisations et amortissements'],
      ['cl-vat', 'Contrôler TVA collectée / déductible de l’année'],
      ['cl-backup', 'Sauvegarder la compta de l’exercice'],
    ],
  },
  'biz-new-client': {
    Avant: [
      ['nc-quote', 'Devis ou proposition signé(e)'],
      ['nc-contract', 'Contrat / bon de commande, CGV acceptées'],
      ['nc-deposit', 'Facture d’acompte si prévue'],
      ['nc-crm', 'Fiche client : coordonnées, SIREN, n° TVA'],
    ],
    Après: [
      ['nc-invoice', 'Facture finale émise'],
      ['nc-paid', 'Paiement reçu et rapproché'],
      ['nc-feedback', 'Demander un retour / une recommandation'],
    ],
  },
  moving: {
    'Ancien logement': [
      ['mv-notice', 'Préavis au bailleur (lettre recommandée)'],
      ['mv-checkout', 'État des lieux de sortie (photos de chaque pièce)'],
      ['mv-utilities', 'Résilier / transférer électricité, gaz, internet, eau'],
      ['mv-mail', 'Réexpédition du courrier (La Poste)'],
    ],
    'Nouveau logement': [
      ['mv-insurance', 'Assurance habitation dès le jour d’entrée'],
      ['mv-checkin', 'État des lieux d’entrée détaillé + relevés de compteurs'],
      ['mv-address', 'Changement d’adresse en ligne (service-public.fr)'],
      ['mv-car', 'Carte grise : nouvelle adresse sous 1 mois (obligatoire)'],
      ['mv-smoke', 'Détecteur de fumée installé et testé'],
    ],
  },
}

export const TASKS: Task[] = (Object.keys(CATALOG) as Frequency[]).flatMap((frequency) =>
  CATALOG[frequency].map(([id, category, title, note, extra]) => {
    const groups = SUBTASKS[id]
    const subtasks = groups
      ? Object.entries(groups).flatMap(([group, rows]) => rows.map(([subId, subTitle]) => ({ id: subId, group, title: subTitle })))
      : undefined
    return { id, category, title, note, frequency, subtasks, ...extra }
  }),
)
