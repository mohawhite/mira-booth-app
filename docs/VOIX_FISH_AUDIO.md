# Voix MIRA — textes à générer dans Fish Audio

Chaque bloc de texte ci-dessous = **un fichier audio**. Copiez-collez le texte dans Fish Audio
(onglet *Text to Speech*), générez, puis téléchargez le fichier sous le **nom indiqué**.

## 1. Réglages (à faire une fois)

- **Modèle :** S2 Pro (le plus récent ; il comprend les indications entre crochets `[ ]`).
  Avec l'ancien modèle S1, remplacez les crochets par des parenthèses : `(calm)`, `(soft tone)`.
- **Voix :** une voix **féminine française**, **posée, chaleureuse, élégante** — ton d'hôtesse
  d'un bel hôtel, pas d'animatrice radio. Gardez **la même voix pour tous les fichiers**.
  Si vous créez la voix vous-même, description possible :
  > Voix de femme française, 30 à 40 ans, timbre doux et chaleureux, diction claire, débit posé, souriante mais calme, élégante.
- **Vitesse :** normale (1.0), ou légèrement plus lente (0.95).
- **Export :** **MP3** (ou WAV). Mono si l'option existe.
- **Test d'abord :** générez `accueil-1` seul. Si la voix **prononce** les mots entre crochets
  (« warm… »), supprimez les crochets de tous les textes : la voix choisie suffira.
- **Licence :** vérifiez que votre abonnement Fish Audio autorise l'**usage commercial** des
  fichiers générés (borne louée à des clients). N'utilisez pas une voix clonée d'une vraie
  personne sans son accord écrit.

Astuce : générez 2 ou 3 fois chaque phrase et gardez la plus naturelle.

---

## 2. Textes en français → dossier `voix/fr/`

**`accueil-1.mp3`** — après avoir touché l'écran
```
[warm, soft voice] Bonsoir, et bienvenue. Choisissez votre format.
```

**`accueil-2.mp3`**
```
[warm, smiling] Bienvenue ! Prêts pour une belle photo ? Choisissez votre format.
```

**`regard-1.mp3`** — début du compte à rebours
```
[calm, gentle] Regardez l'objectif… juste au-dessus de l'écran.
```

**`regard-2.mp3`**
```
[calm, gentle] Les yeux vers l'objectif, en haut… et souriez.
```

**`pose-1.mp3`** — entre deux poses
```
[smiling] Magnifique. Changez de pose !
```

**`pose-2.mp3`**
```
[playful, soft] Encore une… la plus belle.
```

**`pose-3.mp3`**
```
[warm] Parfait. On continue !
```

**`revue.mp3`** — écran de revue
```
[warm, soft voice] Et voici votre photo.
```

**`impression.mp3`** — fin, avec impression
```
[warm, smiling] Merci ! Votre photo s'imprime, elle arrive dans quelques secondes.
```

**`merci.mp3`** — fin, sans impression
```
[warm, smiling] Merci… et très belle soirée !
```

---

## 3. Textes en anglais → dossier `voix/en/` (optionnel)

Même voix si elle parle anglais, sinon une voix anglaise du même style.

**`accueil-1.mp3`**
```
[warm, soft voice] Good evening, and welcome. Please choose your format.
```

**`accueil-2.mp3`**
```
[warm, smiling] Welcome! Ready for a beautiful photo? Choose your format.
```

**`regard-1.mp3`**
```
[calm, gentle] Look at the lens… just above the screen.
```

**`regard-2.mp3`**
```
[calm, gentle] Eyes up to the lens… and smile.
```

**`pose-1.mp3`**
```
[smiling] Beautiful. Strike a new pose!
```

**`pose-2.mp3`**
```
[playful, soft] One more… the best one.
```

**`pose-3.mp3`**
```
[warm] Perfect. Keep going!
```

**`revue.mp3`**
```
[warm, soft voice] And here is your photo.
```

**`impression.mp3`**
```
[warm, smiling] Thank you! Your photo is printing, it will be ready in a few seconds.
```

**`merci.mp3`**
```
[warm, smiling] Thank you… and have a wonderful evening!
```

---

## 4. Avant de m'envoyer les fichiers

- Noms **exactement** comme ci-dessus (minuscules, sans accent, `.mp3`).
- Pas de silence long au début ni à la fin.
- Même volume pour tous (si Fish Audio propose une normalisation, activez-la).
- Rangez-les ainsi, puis envoyez le dossier (ou un .zip) :

```
voix/
├─ fr/  accueil-1.mp3, accueil-2.mp3, regard-1.mp3, regard-2.mp3,
│       pose-1.mp3, pose-2.mp3, pose-3.mp3, revue.mp3, impression.mp3, merci.mp3
└─ en/  (mêmes noms)
```

Le décompte « 3, 2, 1 » reste aux tics sonores : pas besoin de le générer.
