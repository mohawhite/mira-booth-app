# Voix MIRA — génération avec ElevenLabs

Une voix féminine accompagne l'invité aux moments clés (10 phrases courtes). Le décompte
« 3, 2, 1 » reste aux tics sonores.

## 1. Choisir la voix

> **Fichiers en place :** `src/renderer/public/voix/fr/` contient la version « Alice » (10 fichiers,
> volume égalisé à environ -16 LUFS). Les régénérer avec le script les remplace (`FORCE=1`).

**Voix retenue : Victoria – Warm and calm** (accent parisien), ID `WeAAwKYcS06VmXw086yZ`,
utilisée par défaut par le script. Pour en changer : `$env:ELEVENLABS_VOICE_ID="autre_id"`.

- ElevenLabs → **Voix** → **Bibliothèque** : filtrer **Français**, **Féminin**.
- Ton recherché : **posé, chaleureux, élégant** (hôtesse d'un bel hôtel, pas animatrice radio).
- Écouter avec la phrase : « Bonsoir, et bienvenue. Choisissez votre format. »
- Ajouter la voix à **Mes voix**, puis menu **⋯** → **Copier l'ID de la voix**.

**Licence :** l'offre gratuite d'ElevenLabs n'autorise pas l'usage commercial. Pour une borne
louée à des clients, il faut au minimum l'offre **Starter**. Vérifiez les conditions sur leur site.

## 2. Créer la clé API

ElevenLabs → **Développeurs** → **Clés API** → **Créer une clé** :
- Nom : `mira-booth` ;
- **Restreindre la clé** : activé, **Text to Speech → Accès**, tout le reste **Pas d'accès** ;
- Limite de crédits : par exemple 5 000 (largement suffisant).

Copiez la clé tout de suite. Ne la collez jamais dans un fichier du projet ni dans un chat.

## 3. Générer les fichiers (une commande)

Dans le dossier du projet (PowerShell) :

```powershell
git pull
$env:ELEVENLABS_API_KEY="votre_cle"
npm run voix
```

- Anglais aussi : `$env:LANGS="fr,en"` avant `npm run voix`.
- Régénérer après une modification : `$env:FORCE="1"`.
- Les fichiers arrivent dans `src/renderer/public/voix/<langue>/`.
- Le ton se règle dans `scripts/generer-voix.mjs` (`stability`, `style`) ; les textes dans
  `scripts/voix-phrases.json`.

## 4. Les phrases

### Français (`voix/fr/`)

| Fichier | Moment | Texte |
|---|---|---|
| `accueil-1.mp3` | après avoir touché l'écran | Bonsoir, et bienvenue. Choisissez votre format. |
| `accueil-2.mp3` | variante | Bienvenue ! Prêts pour une belle photo ? Choisissez votre format. |
| `regard-1.mp3` | début du compte à rebours | Regardez l'objectif… juste au-dessus de l'écran. |
| `regard-2.mp3` | variante | Les yeux vers l'objectif, en haut… et souriez. |
| `pose-1.mp3` | entre deux poses | Magnifique. Changez de pose ! |
| `pose-2.mp3` | variante | Encore une… la plus belle. |
| `pose-3.mp3` | variante | Parfait. On continue ! |
| `revue.mp3` | écran de revue | Et voici votre photo. |
| `impression.mp3` | fin, avec impression | Merci ! Votre photo s'imprime, elle arrive dans quelques secondes. |
| `merci.mp3` | fin, sans impression | Merci… et très belle soirée ! |

### Anglais (`voix/en/`, optionnel)

| Fichier | Moment | Texte |
|---|---|---|
| `accueil-1.mp3` | après avoir touché l'écran | Good evening, and welcome. Please choose your format. |
| `accueil-2.mp3` | variante | Welcome! Ready for a beautiful photo? Choose your format. |
| `regard-1.mp3` | début du compte à rebours | Look at the lens… just above the screen. |
| `regard-2.mp3` | variante | Eyes up to the lens… and smile. |
| `pose-1.mp3` | entre deux poses | Beautiful. Strike a new pose! |
| `pose-2.mp3` | variante | One more… the best one. |
| `pose-3.mp3` | variante | Perfect. Keep going! |
| `revue.mp3` | écran de revue | And here is your photo. |
| `impression.mp3` | fin, avec impression | Thank you! Your photo is printing, it will be ready in a few seconds. |
| `merci.mp3` | fin, sans impression | Thank you… and have a wonderful evening! |

## 5. Sans l'API (copier-coller)

Dans ElevenLabs → **Text to Speech**, choisissez la voix et le modèle **Eleven Multilingual v2**,
collez chaque texte du tableau, générez, et téléchargez le fichier sous le nom indiqué (MP3).
Rangez-les dans `src/renderer/public/voix/fr/`.

## 6. Dans la borne

- La voix se déclenche seule : choix du format, première pose, entre les poses, revue, fin.
- **Espace opérateur → Système** : activer/couper la voix, régler le volume, bouton
  **Écouter**, et nombre de fichiers trouvés par langue (ex. « FR : 10/10 fichiers »).
- S'il manque des fichiers, la borne reste simplement muette à ces moments-là.
- Pour que la borne les garde après une mise à jour, enregistrez les fichiers dans le dépôt :
  `git add src/renderer/public/voix` puis `git commit -m "Voix Victoria"` et `git push`.
