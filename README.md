# Portfolio — Marjolaine Gutierrez

Site statique (HTML/CSS/JS, sans build), en ligne sur https://www.marjolainegutierrez.fr

- `index.html` : home (one page) ; le bloc contact est en bas (`#contact`), `/contact` y redirige via `vercel.json`
- `assets/style.css`, `assets/main.js` : styles et animations
- `assets/fonts/` : Geist et Geist Mono auto-hébergées (pas d'appel à Google Fonts, RGPD-friendly)

Images : `assets/images/` (WebP optimisés, récupérés depuis Framer).

Déploiement : chaque push sur `main` est publié automatiquement par Vercel
(dépôt GitHub public margegutierrez/portfolio relié au projet Vercel marjolainegutierrez).
Framework preset : "Other", pas de commande de build, dossier racine `/`.

Vidéos projets : `assets/videos/*.mp4` (boucles 8 s, H.264, sans son). Chargées à la première
apparition, lues uniquement quand la vignette est à l'écran. L'image WebP sert d'affiche.
Pour remplacer une boucle par une vraie vidéo : même nom de fichier, format carré 800×800
(Joseph Duclos : 800×960), idéalement < 1 Mo.
