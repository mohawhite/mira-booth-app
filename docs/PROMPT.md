# PROMPT — Développement de **MIRA BOOTH APP**

> Copie tout ce qui suit dans ton assistant de développement (Claude Code, Cursor, etc.).
> Le prompt est découpé en **Phase 1 — Prototype** puis **Phase 2 — Version opérationnelle**. Fais d'abord valider la Phase 1, puis lance la Phase 2 dans une nouvelle demande en rappelant ce document.

---

## 1. Rôle et mission

Tu es un **développeur senior full-stack et un designer UI/UX produit**, spécialisé dans les applications kiosque tactiles et les logiciels de photobooth événementiel (mariages, soirées d'entreprise, salons, activations de marque).

Ta mission : concevoir et développer **MIRA BOOTH APP**, un logiciel de borne photo **stylé, professionnel, unique, élégant et intuitif**. Il tourne sur une borne équipée d'un **écran tactile de 15,6"** et livre les photos **imprimées** ou **par voie numérique** (QR code, e-mail, SMS, galerie en ligne).

Le produit doit pouvoir rivaliser avec les références du marché (dslrBooth, Breeze Booth, Snappic, LumaBooth, Touchpix, Fotomaster) tout en ayant **sa propre identité** : plus raffiné, plus simple pour l'invité, plus agréable pour l'opérateur.

### ⚠️ Règle absolue : AUCUNE intelligence artificielle

MIRA BOOTH APP **n'utilise aucune IA**, ni en local ni dans le cloud :
- pas de génération ou de transformation d'image par IA (styles, échange de visage, avatars) ;
- pas de détourage automatique, pas de retouche « beauté » automatique ;
- pas de reconnaissance ou de détection de visage, de sourire ou de présence ;
- pas de bibliothèque de machine learning (TensorFlow, ONNX, MediaPipe…) ni d'API IA.

Tous les traitements d'image sont **classiques et déterministes** : recadrage, redimensionnement, superposition de cadres et de calques PNG, filtres colorimétriques, chroma key par couleur. C'est aussi un argument commercial : simplicité, rapidité et respect de la vie privée.

---

## 2. Matériel cible (configuration réelle de la borne)

| Élément | Modèle exact | Conséquences pour le logiciel |
|---|---|---|
| Borne | Coque métal blanche sur pied, **écran tactile 15,6" en horizontal (paysage, 1920×1080)**. L'objectif est placé **derrière une fenêtre ronde au-dessus de l'écran**. Livrée en flight case. | Interface conçue **uniquement en paysage 1920×1080**. L'invité se tient à environ 60–100 cm et regarde l'objectif, au-dessus de l'écran : l'UI doit l'inviter à **lever les yeux vers l'objectif** pendant le compte à rebours (flèche ou halo animé en haut de l'écran). |
| PC | **Intel Core i5, 8 Go de RAM, SSD 256 Go**, Windows 10/11 x64 | Budget mémoire serré : application ≤ 1,5 Go de RAM en usage, une seule fenêtre Electron, pas de traitement lourd. Disque limité : surveiller l'espace et archiver/purger les anciens événements (alerte sous 20 Go libres). |
| Appareil photo | **Canon EOS 2000D** (24 Mpx, APS-C, USB mini-B 2.0) | Pilotage par le **Canon EDSDK** (voir §2.1). |
| Imprimante | **DNP DS-RX1HS**, tirages **10×15 (4×6")** | Sublimation thermique, environ **12,4 s par tirage**, 300 DPI (voir §2.2). |
| Éclairage | **Lampe d'appoint en lumière continue** (pas de flash) | Pas de synchronisation flash à gérer. L'exposition est réglée pour une lumière continue (voir §2.1). La lampe n'est pas pilotée par le logiciel. |
| Réseau | Variable selon le lieu | Fonctionnement **100 % hors ligne garanti**, avec synchronisation quand Internet revient. |

### 2.1 Canon EOS 2000D — contraintes à respecter

- **SDK** : Canon EDSDK (gratuit, inscription au programme développeur Canon). Il est intégré via un **sidecar natif** (C++ ou C#/.NET) qui communique avec Electron par IPC ou WebSocket local. Le module ne doit jamais tourner dans le processus de rendu. Prévois **digiCamControl** comme pilote de secours sous Windows.
- **Live view** : le flux EVF de l'EDSDK est en résolution réduite (environ 960×640) et la fréquence dépend de l'USB 2.0. Vise **≥ 20 fps** en récupérant les images dans une boucle dédiée, puis en les envoyant à l'UI en JPEG/ArrayBuffer sans copie inutile. Mets à l'échelle en CSS et ajoute un léger lissage pour l'élégance.
- **Capture** : enregistrement **vers le PC** (`kEdsSaveTo_Host`), pas sur la carte SD, ou les deux en option. Pour la vitesse, utilise le **JPEG taille M ou S1, qualité fine** (largement suffisant pour un 10×15 à 300 DPI). L'option RAW reste désactivée. Objectif : photo affichée en moins de 2 s après le déclenchement.
- **Mise au point** : l'autofocus en live view du 2000D est lent. Lance l'AF **pendant le compte à rebours** (à environ T-1,5 s), puis déclenche. Option « mise au point fixe » (AF verrouillé à l'installation) recommandée pour une borne à distance constante.
- **Exposition pour lumière continue** : mode **M** recommandé (ex. 1/125 s, f/5.6, ISO 400–800), balance des blancs fixe ou personnalisée et flash intégré **désactivé**. Le back-office doit permettre de régler ISO, ouverture, vitesse, balance des blancs et format JPEG, avec un **bouton « photo test »**.
- **Alimentation et veille** : la batterie ne tient pas un événement. Le prompt doit inclure, dans la doc d'installation, l'usage du **coupleur secteur DR-E10 + adaptateur CA-PS700**. Le logiciel désactive l'extinction automatique de l'appareil (si l'EDSDK le permet) et envoie un « keep-alive ».
- **Robustesse** : détection de la déconnexion USB, **reconnexion automatique** sans redémarrer l'application, relance du live view après chaque capture, gestion des erreurs « appareil occupé » (retry avec backoff) et de l'absence de carte SD (le 2000D peut refuser de déclencher sans carte : à tester et signaler à l'opérateur).
- **Orientation** : l'appareil est monté **à l'horizontale** derrière la fenêtre ronde. Le live view 3:2 est affiché en grand dans l'écran 16:9, avec un cadre de composition qui correspond au format d'impression choisi. Un réglage « rotation 0/180° » et un recadrage fin compensent le montage. Le **vignettage de la fenêtre ronde** doit être vérifié : prévoir un recadrage automatique configurable des bords.

### 2.2 DNP DS-RX1HS — contraintes à respecter

- **Pilote** : pilote Windows officiel DNP (à installer **avant** de brancher l'imprimante en USB, puis redémarrer). Le logiciel imprime **en silence** vers le nom d'imprimante choisi, sans boîte de dialogue.
- **Format** : papier **10×15 (4×6")**. Rends l'image finale à **300 DPI** : 1800×1200 px utiles, **plus une marge de fond perdu**. Le pilote DNP attend souvent une zone légèrement plus grande (environ 1844×1240 px). **Vérifie la taille exacte dans le pilote** et rends-la configurable, avec un réglage de décalage et d'échelle pour caler l'impression.
- **Formats exploitables sur papier 10×15** : photo unique, grille 2×2, et **bandelettes 5×15 (2×6") ×2 par feuille** grâce à l'option « 2 inch cut » du pilote (firmware ≥ 1.10, pilote ≥ 1.1.0.0). L'application duplique automatiquement la bandelette sur la feuille.
- **Finition** : brillant ou mat (option du pilote), réglable par événement.
- **Cadence** : environ 12,4 s par tirage. La **file d'impression** est persistante (survit à un redémarrage), avec affichage « Impression en cours… » sur l'écran Merci et estimation du temps si plusieurs tirages sont en attente.
- **État** : lire l'état de l'imprimante (hors ligne, porte ouverte, papier ou ruban épuisé, nombre de tirages restants) via le spouleur Windows et, si possible, la bibliothèque d'état DNP (CspStat/SDK DNP). Le **compteur de tirages restants** (rouleau d'environ 700 tirages 10×15) s'affiche dans le back-office, avec une alerte opérateur sous 50 tirages.
- **Si l'imprimante est indisponible**, l'invité reçoit quand même son QR code, et l'impression est mise en file pour plus tard.

---

## 3. Stack technique recommandée

- **Shell desktop** : **Electron** (dernière version stable) en mode kiosque plein écran, sans barre de titre, avec démarrage automatique au boot. Alternative acceptable : Tauri 2, si tu justifies le choix.
- **UI** : **React 18 + TypeScript + Vite**, **Tailwind CSS** avec des design tokens, **Framer Motion** pour les animations et **Zustand** pour l'état global.
- **Machine à états du parcours invité** : **XState**. Le parcours doit être déterministe, testable et sans état bloquant possible.
- **Rendu des compositions** : Canvas 2D / OffscreenCanvas côté UI pour l'aperçu, puis **sharp** (Node) pour le rendu final 10×15 à 300 DPI, avec fond perdu (voir §2.2).
- **Caméra** : une couche d'abstraction `CameraDriver` avec :
  - `WebcamDriver` (`getUserMedia`, Phase 1) ;
  - `MockCameraDriver` (images de test, pour développer sans matériel) ;
  - `CanonEdsdkDriver` (EOS 2000D via un sidecar natif, Phase 2) ;
  - `DigiCamControlDriver` (secours Windows).
- **Impression** : une couche `PrinterDriver` avec `MockPrinter` (Phase 1) et `DnpRx1Driver` (Phase 2). Impression silencieuse Windows vers le pilote DNP, avec gestion du format 10×15, de l'option « 2 inch cut » et de la lecture d'état.
- **Stockage local** : **SQLite** (better-sqlite3) pour les sessions, réglages et files d'attente. Les fichiers sont rangés par événement, par exemple `/events/{eventId}/{sessionId}/`.
- **Partage numérique** : un mini-backend (**Node/Fastify** ou **Supabase**) avec stockage objet (S3 / Cloudflare R2), une galerie web par événement et des liens courts avec QR code. E-mail via Resend ou Brevo, SMS via Twilio ou Brevo.
- **Qualité** : ESLint, Prettier, Vitest (logique), Playwright (parcours E2E) et un build signé via electron-builder (NSIS).

---

## 4. Identité visuelle — l'ADN « MIRA »

*Mira* signifie « regarde » en espagnol et en italien, et c'est aussi le nom d'une étoile. L'interface doit évoquer **le regard, la lumière et l'instant précieux**.

**Direction artistique : « luxe éditorial nocturne »**, l'élégance d'un magazine de mode avec la chaleur d'une soirée.

- **Palette (tokens)** :
  - `--ink` #0E0D12 (fond principal, noir velours)
  - `--night` #1A1822 (surfaces)
  - `--champagne` #C9A96E (accent principal, or champagne)
  - `--ivory` #F5F0E8 (texte et surfaces claires)
  - `--rose` #E8C4C0 (accent secondaire doux)
  - `--success` #7FB69E, `--danger` #D9786F
  - Un **thème clair « Ivoire »** et la **personnalisation complète par événement** : couleurs, logo, arrière-plan vidéo, polices.
- **Typographie** : titres en serif à fort contraste (**Cormorant Garamond** ou **Playfair Display**), interface en sans-serif géométrique (**Manrope** ou **Inter**). Taille minimale du texte : 22 px, titres de 56 à 96 px.
- **Signature visuelle unique** :
  - un **iris / halo lumineux** animé (anneau doré qui « respire ») utilisé comme motif récurrent : écran d'accueil, compte à rebours, chargement ;
  - le compte à rebours se fait sous forme d'**anneau qui se referme** autour du live view, avec de grands chiffres serif et un léger tick sonore ;
  - au déclenchement, un **flash blanc doux** suivi d'un effet « développement photo » (l'image apparaît du noir vers la couleur).
- **Matières** : glassmorphism discret (flou + bordure 1 px champagne à 20 %), grain photo très léger, ombres longues et douces. **Aucun** effet criard ni emoji.
- **Motion design** : transitions de 250 à 450 ms, courbes `easeOutExpo`, 60 fps constants. Mode « animations réduites » disponible.
- **Son** : jeu de sons feutrés et désactivable (tap, tick, déclencheur, succès).

---

## 5. Principes UX kiosque (non négociables)

1. **Compris en 3 secondes** : l'invité est pressé, distrait, parfois un verre à la main, et l'utilise pour la première fois. Un seul appel à l'action par écran.
2. **Zones tactiles ≥ 80×80 px** (bouton principal ≥ 120 px de haut), espacées d'au moins 24 px. Pas de survol, pas de double-tap, pas de geste caché pour l'invité.
3. **Aucune impasse** : chaque écran a un retour possible et un **délai d'inactivité** (configurable, 45 s par défaut) qui ramène doucement à l'accueil.
4. **Le live view est roi** : effet miroir dans l'aperçu, mais pas sur la photo finale (option). Cadre de composition visible.
5. **Clavier virtuel intégré**, élégant, avec suggestions de domaines (@gmail.com…) et validation en direct des e-mails et numéros (indicatif +33 par défaut, liste de pays).
6. **Multilingue** : FR (par défaut), EN, ES, AR (avec support **RTL**), via i18n.
7. **Accessibilité** : contrastes WCAG AA, mode « hauteur assise » (UI recentrée en bas de l'écran), textes alternatifs, durées du compte à rebours ajustables.
8. **Démarrage simple** : un toucher n'importe où sur l'écran d'attente. En option, déclenchement par une **télécommande ou un bouton physique** (bouton USB/Bluetooth vu comme une touche clavier). Aucune détection de visage, de sourire ou de présence.
9. **Écran d'attente attractif** : diaporama des dernières photos de l'événement (si autorisé), vidéo de marque et invitation animée « Touchez pour commencer ».
10. **Robustesse visible** : les problèmes matériels ne s'affichent jamais en jargon technique devant l'invité. Seul un message élégant apparaît (« Un instant, nous préparons la magie… ») et l'opérateur est alerté.

---

## 6. Parcours invité (machine à états)

```
ATTENTE → ACCUEIL → CHOIX DU FORMAT → (CHOIX DU FILTRE / FOND) → PRÉPARATION
→ COMPTE À REBOURS → CAPTURE (×N) → REVUE → (REPRISE) → COMPOSITION
→ LIVRAISON (Impression / QR / E-mail / SMS) → CONSENTEMENT → MERCI → ATTENTE
```

- **Formats** (tous imprimés sur papier 10×15) : Photo unique, Bandelette 3–4 poses (5×15, ×2 par feuille), Grille 4 poses (2×2), GIF/Boomerang (numérique uniquement), Mode « Glam » (noir & blanc élégant). Pas de vidéo (le 2000D n'est pas adapté à la vidéo pilotée par USB).
- **Compte à rebours** : 3 à 10 s, configurable, avec des messages d'animation entre les poses (« Prenez la pose ! », « Une grimace ? »).
- **Revue** : affichage de la composition finale avec boutons **Reprendre** (nombre de reprises limité) et **Valider**.
- **Livraison** : nombre de copies (limite configurable par session et par événement), QR code affiché en grand (lien vers la galerie personnelle), e-mail et SMS.
- **Consentement RGPD** : case non pré-cochée, lien vers la politique de confidentialité (affichée dans l'app via un QR code), choix « apparaître dans la galerie publique / diaporama ».
- **Merci** : animation de signature et rappel « Vos photos s'impriment ».

---

## 7. Espace opérateur (back-office)

Accès par un **geste secret** (appui long de 3 s dans un coin) plus un **code PIN**.

- **Tableau de bord** : état de la caméra, de l'imprimante (papier restant, ruban, erreurs), du réseau, du disque et de la file d'envoi. Compteurs de sessions, d'impressions et de partages.
- **Événements** : créer, dupliquer ou archiver un événement (nom, date, client, thème, formats actifs, quotas d'impression, langues, textes).
- **Éditeur de modèles (templates)** : glisser-déposer pour placer les zones photo, le logo, les textes dynamiques (date, nom de l'événement, hashtag) et les calques PNG. Aperçu à l'échelle réelle 300 DPI. Bibliothèque de modèles élégants inclus (mariage, corporate, anniversaire, gala).
- **Réglages caméra** : choix de la source (webcam / EOS 2000D), rotation, miroir, recadrage, ISO, ouverture, vitesse, balance des blancs, taille JPEG, mode de mise au point (AF au compte à rebours / fixe), bouton « photo test » et histogramme.
- **Réglages impression** : imprimante, taille de rendu et fond perdu, décalage et échelle de calage, **page de test de calage**, découpe 2", brillant ou mat, copies maximum, **mode file d'attente**, réimpression depuis l'historique et compteur de tirages restants.
- **Galerie de l'événement** : parcourir, supprimer, réimprimer et exporter (ZIP).
- **Statistiques et export** : CSV des sessions et des contacts collectés (uniquement si consentement), avec graphiques simples.
- **Maintenance** : journaux, test caméra et impression, mise à jour de l'application, sauvegarde et restauration.

---

## 8. Exigences non fonctionnelles

- **Performance (sur i5 / 8 Go)** : démarrage < 8 s, live view webcam ≥ 30 fps, live view EOS 2000D ≥ 20 fps, rendu de composition 10×15 < 1,5 s, RAM ≤ 1,5 Go, CPU au repos < 10 %, retour à l'accueil instantané.
- **Fiabilité** : fonctionnement continu de 12 h sans fuite mémoire. Watchdog qui relance la fenêtre en cas de crash. Reprise automatique de la file d'impression et d'envoi.
- **Hors ligne d'abord** : toutes les photos sont d'abord enregistrées localement. Les QR codes pointent vers une URL déterminée à l'avance, accessible dès que la synchronisation est faite.
- **Sécurité et RGPD** : chiffrement des données de contact au repos, purge automatique configurable (ex. 30 jours), aucune donnée envoyée sans consentement. Les photos ne sont jamais transmises à des services tiers d'analyse.
- **Architecture** : code modulaire, avec des interfaces `CameraDriver`, `PrinterDriver`, `DeliveryChannel` et `StorageProvider` et des implémentations **mock** pour développer sans matériel.

---

## 9. PHASE 1 — PROTOTYPE (à livrer en premier)

Objectif : une démo **cliquable et fonctionnelle sur un PC portable**, qui montre l'expérience complète et le design final.

Inclure :
1. Le projet Electron + React + TS structuré (monorepo léger : `apps/booth`, `packages/core`, `packages/ui`).
2. Le design system complet (tokens, composants : boutons, cartes, clavier virtuel, anneau de compte à rebours, toasts, modales).
3. Le parcours invité complet avec XState : attente, accueil, formats (photo unique, bandelette, grille), compte à rebours, capture **webcam**, revue, composition, livraison.
4. Le rendu des compositions **10×15** avec 3 modèles élégants prêts à l'emploi (photo unique, grille 2×2, bandelettes ×2).
5. **Impression simulée** : `MockPrinter`, qui génère le fichier 300 DPI au format attendu par la DNP DS-RX1HS et l'affiche. Si la DNP est déjà branchée, une impression réelle est possible en option via son pilote Windows.
6. **Partage simulé** : QR code généré vers une URL locale de la galerie (serveur local léger), formulaire e-mail avec validation (envoi simulé et journalisé).
7. Un back-office minimal : PIN, choix du thème, du format, de la durée du compte à rebours et de la caméra, galerie locale.
8. Les écrans conçus pour le **1920×1080 paysage**, testés en simulant un écran 15,6".
9. FR et EN.
10. Un README : installation, lancement, raccourcis développeur, captures d'écran.

**Critères d'acceptation Phase 1** : un invité inconnu réalise une session complète (photo → QR) en moins de 60 s sans aide. Aucune impasse. Animations fluides. Le design est validé visuellement en 1920×1080.

---

## 10. PHASE 2 — VERSION OPÉRATIONNELLE

1. Pilote **Canon EOS 2000D** via un sidecar EDSDK (voir §2.1) : live view, AF pendant le compte à rebours, capture vers le PC, réglages d'exposition, reconnexion automatique. digiCamControl sert de secours.
2. Pilote **DNP DS-RX1HS** (voir §2.2) : impression silencieuse 10×15, bandelettes avec découpe 2", calage, état papier et ruban, compteur de tirages, file d'attente persistante.
3. Backend cloud : galeries par événement, liens courts, envoi e-mail et SMS, synchronisation hors ligne, tableau de bord web pour l'opérateur.
4. Éditeur de modèles complet (glisser-déposer).
5. GIF/Boomerang (à partir de 4 à 6 captures rapides), filtres photo classiques (noir & blanc, sépia, chaud, froid, contraste, via LUT ou matrices de couleur) et fond vert (chroma key classique par couleur, pas de détourage automatique).
6. Mode kiosque Windows : démarrage auto, compte local dédié, verrouillage (pas d'accès au bureau), désactivation de la mise en veille, de l'écran de veille et des notifications Windows, watchdog, mises à jour automatiques (electron-updater), installateur signé.
7. **Checklist d'installation de la borne** : pilote DNP avant branchement, EDSDK, coupleur DR-E10, réglages Windows, calibrage du tactile 15,6", page de test d'impression et photo test.
8. Licences et comptes : activation par borne, multi-événements, multi-opérateurs.
9. Tests : unitaires, E2E Playwright sur le parcours complet, **test d'endurance de 12 h sur la vraie borne** (EOS 2000D + DNP), et tests de débranchement et rebranchement de l'appareil photo et de l'imprimante en pleine session.
10. Documentation opérateur (FR) et guide de mise en route d'une borne.

---

## 11. Méthode de travail attendue

1. **Avant de coder**, propose : l'arborescence du projet, le diagramme de la machine à états, la liste des écrans avec un wireframe textuel de chacun, et les tokens du design system. Attends ma validation.
2. Développe ensuite **par incréments livrables** (un écran ou une fonctionnalité à la fois) et **montre une capture d'écran** à chaque étape.
3. Code propre, typé, commenté avec parcimonie et sans dépendance inutile.
4. Signale clairement tout choix technique discutable et toute limite matérielle (pilotes, SDK propriétaires, licences).
5. Ne simplifie jamais le design au détriment de l'élégance : **chaque écran doit pouvoir figurer sur un portfolio de design.**

**Commence maintenant par l'étape 11.1 pour la Phase 1.**
