# BDkids 📚

**« On l'a déjà, ce tome, ou pas ? »** — la question classique au rayon BD jeunesse d'une
librairie, avec un enfant qui tire la manche. BDkids y répond en deux secondes : la bibliothèque
BD de tes enfants dans ta poche, tome par tome, série par série.

**En ligne, gratuit, sans compte : https://nkoziel.github.io/bdkids-app/**

![Bibliothèque BDkids](docs/screenshots/library.jpg)

## Pourquoi

Pas de suivi de lecture, pas de notation, pas de recommandations à la AniList — juste la seule
question qui compte en librairie : **possédé ou pas**, tome par tome. Ariol, Astérix, Les
Légendaires, Les Sisters, Bergères guerrières... plus de repartir avec un doublon, ou de laisser
un trou dans la collection sans le savoir.

## Fonctionnalités

- 🔍 **Catalogue de 85 séries BD jeunesse franco-belges** (classiques comme Astérix, Tintin,
  Lucky Luke, et jeunesse contemporaine comme Ariol, Les Sisters, Mortelle Adèle...) — recherche
  instantanée, ajout en un clic avec couverture, éditeur et liste des tomes déjà pré-remplis
- 🖼️ **La vraie couverture de chaque tome**, pas juste un numéro — grisée si pas encore possédée,
  cochée en vert sinon, pour repérer les trous d'un coup d'œil
- ✅ **Grille tactile pour cocher les tomes possédés**, ou un geste "ajouter une plage" pour aller
  vite (ex : tomes 1 à 12 d'un coup)
- 🕳️ **Badge des trous dans la collection**, visible directement sur la bibliothèque
- ✏️ **Ajout manuel** pour toute série absente du catalogue
- 📴 **100% hors-ligne** une fois chargée — installable comme une vraie appli (PWA), pratique en
  librairie sans réseau
- 🔒 **Aucun compte, aucun serveur** : tout reste dans le navigateur, rien n'est envoyé nulle part

## Aperçu

**La fiche d'une série** — la vraie couverture de chaque tome, grisée pour les tomes manquants :

![Grille des tomes avec couvertures, un tome manquant en grisé](docs/screenshots/sheet.jpg)

**Ajouter une série** — recherche dans le catalogue local, résultat pré-rempli en un clic :

![Recherche « Titeuf » dans le catalogue local](docs/screenshots/add.jpg)

## Installer sur le téléphone

Ouvre https://nkoziel.github.io/bdkids-app/ dans Chrome (Android) ou Safari (iOS), puis
« Ajouter à l'écran d'accueil ». L'appli s'installe comme une vraie appli et fonctionne ensuite
hors-ligne.

## Comment ça marche

Aucun serveur, aucune base de données distante : le catalogue (séries + tomes + couvertures) est
figé au moment du build à partir des données publiques de [BDovore](https://www.bdovore.com/) et
livré tel quel dans l'appli — `tools/fetch-bdovore.js` régénère ce catalogue à la demande, mais
l'appli livrée ne fait **aucun appel réseau vers BDovore**. Voir `CLAUDE.md` pour le détail de
l'architecture et l'état d'avancement.

## Développement

```
npm install
npm run dev       # serveur de dev Vite sur src/
npm run test       # Vitest
npm run verify      # tools/check-refs.js + Vitest
```

## Build

```
npm run build      # src/ -> dist/index.html -> copié à la racine du repo
```

Fichier `index.html` unique (build Vite + `vite-plugin-singlefile`), déployé sur GitHub Pages à
chaque push sur `main`.
