# Maison des Gâteaux

Site vitrine d'une pâtisserie artisanale — HTML / CSS / JS vanilla, aucune dépendance.

## Structure du projet

```
maison-des-gateaux/
├── assets/
│   └── images/              ← Placer ici tous les visuels (voir liste ci-dessous)
├── styles/
│   ├── variables.css        ← Tokens de design (couleurs, typo, espacement…)
│   └── main.css             ← Feuille de styles principale (importe variables.css)
├── scripts/
│   └── app.js               ← JS vanilla : navbar, animations, galerie, formulaire
├── index.html               ← Page unique (SPA-like, navigation par ancres)
└── README.md
```

## Images à fournir

Remplacez les fichiers placeholders dans `assets/images/` par les vrais assets :

| Fichier                    | Usage                            | Format recommandé | Dimensions min. |
|---------------------------|----------------------------------|-------------------|-----------------|
| `logo.png`                | Logo navbar + favicon            | PNG (fond transp.)| 200 × 80 px     |
| `hero.jpg`                | Bannière principale plein écran  | JPEG / WebP       | 1920 × 1080 px  |
| `gateau-anniversaire.jpg` | Card "Gâteau d'anniversaire"     | JPEG / WebP       | 800 × 600 px    |
| `gateau-mariage.jpg`      | Card "Pièce montée mariage"      | JPEG / WebP       | 800 × 600 px    |
| `gateau-evenement.jpg`    | Card "Gâteau événement"          | JPEG / WebP       | 800 × 600 px    |
| `foret-noire.jpg`         | Card "Forêt noire" + galerie     | JPEG / WebP       | 800 × 600 px    |
| `fraisier.jpg`            | Card "Fraisier" + galerie        | JPEG / WebP       | 800 × 600 px    |
| `gallery-1.jpg`           | Galerie — image 1                | JPEG / WebP       | 800 × 800 px    |
| `gallery-2.jpg`           | Galerie — image 2                | JPEG / WebP       | 800 × 800 px    |

> **Conseil** : exportez en WebP pour de meilleures performances, et compressez avec [Squoosh](https://squoosh.app) ou [TinyPNG](https://tinypng.com).

## Lancer le projet en local

Ouvrez `index.html` directement dans un navigateur, **ou** utilisez un serveur local pour éviter les restrictions CORS :

```bash
# Option 1 — Python (installé par défaut sur macOS/Linux)
python3 -m http.server 8080

# Option 2 — Node (si npx disponible)
npx serve .

# Option 3 — Extension VS Code
# Installer "Live Server" → clic droit sur index.html → "Open with Live Server"
```

Puis ouvrir : `http://localhost:8080`

## Personnalisation rapide

| Ce que vous voulez changer | Où modifier                    |
|---------------------------|--------------------------------|
| Couleurs et typographie   | `styles/variables.css`         |
| Contenu des sections      | `index.html`                   |
| Comportement JS           | `scripts/app.js`               |
| Mise en page / animations | `styles/main.css`              |

## Prochaines étapes suggérées

- [ ] Ajouter les vraies images dans `assets/images/`
- [ ] Brancher le formulaire de contact à un service e-mail (EmailJS, Formspree, backend propre…)
- [ ] Ajouter les polices Google Fonts en self-hosted pour la performance
- [ ] Configurer un favicon multi-tailles (`favicon.ico`, `apple-touch-icon.png`)
- [ ] Mettre en place un pipeline de compression d'images (ex: `sharp` en Node)
- [ ] Déployer sur Vercel / Netlify / GitHub Pages (glisser-déposer le dossier)
