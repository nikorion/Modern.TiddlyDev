# Écarts locaux vs upstream Modern.TiddlyDev — détail

Rationale complète des écarts listés en table dans le CLAUDE.md. Numérotation alignée sur cette table.

## 1. Anglais uniquement
Supprimés — gadgets démo du wiki de dev, sans lien avec l'i18n du plugin livré :

- `wiki/tiddlers/LanguageSwitcher.tid` — bouton injecté sous chaque tiddler affiché (`tags: $:/tags/ViewTemplate`), bascule toute l'interface TW en changeant `$:/language` :
  ```
  🇬🇧 Switch to English   (si langue courante = zh)
  🇨🇳 切换至中文            (sinon)
  ```
- Bloc « Switch language » de `$:/Modern.TiddlyDev/Startup` (`wiki/tiddlers/system/$__Modern.TiddlyDev_Startup.tid`, `tags: $:/tags/StartupAction/Browser`) — détectait la langue du navigateur et forçait l'interface en zh-Hans si elle commençait par `zh` :
  ```
  <$action-setfield $tiddler="$:/language" text={{{ [{$:/info/browser/language}search:title[zh]then[zh-Hans]else[en-GB]addprefix[$:/languages/]] }}}/>
  ```
  (les 2 autres blocs du même fichier — repli sidebar écran étroit, thème clair/sombre auto — sont conservés, seul ce bloc a été retiré).
- `src/plugin-name/language/zh-Hans/` (dossier entier) — traductions chinoises du plugin de démo : `Readme.tid` (readme embarqué) + `Translations.multids` (chaînes `Name`, `Description`, `Configs/…`).
- `"languages": ["zh-Hans"]` dans `wiki/tiddlywiki.info` — chargeait le pack de langue chinoise du core TiddlyWiki en plus de l'anglais.

## 2. Registre npm officiel — retrait du miroir chinois
La ligne `registry=http://registry.npmmirror.com` a été retirée de `.npmrc`. Elle forçait tous les `pnpm/npm install` sur `registry.npmmirror.com` (miroir chinois ex-« cnpm », Alibaba, copie synchronisée du registre officiel) au lieu du défaut `https://registry.npmjs.org`. Pertinent uniquement depuis la Chine (accès npmjs lent/bridé). Hors Chine, effet indésirable : latence plus élevée, fraîcheur parfois en retard, dépendance à une infra tierce pour des builds censés être reproductibles. Retour au registre officiel (bon défaut ce poste). Ce template est international/anglais : tout réglage Chine-spécifique est à retirer (cf. écart 1).

## 3. Tailwind désactivé (2026-07)
Le pipeline Tailwind v4 reste câblé côté moteur (`packup.ts` de `tiddlywiki-plugin-dev` : `@tailwindcss/postcss` + autoprefixer), mais il n'est plus **activé** dans ce template — choix de partir sur du CSS/SCSS classique. Changements :

- `src/plugin-name/index.css` : les deux imports `@import "tailwindcss/theme.css" layer(theme);` + `@import "tailwindcss/utilities.css" layer(utilities);` sont **commentés** (avec la marche à suivre pour réactiver).
- `index.ts` : les classes utilitaires démo du bouton (`p-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700`) sont retirées ; ne reste que `tc-example-widget` (stylé dans `index.css`).

**Piège à connaître avant de réactiver — ne pas utiliser `@import "tailwindcss";` seul** : cet import global inclut aussi `layer(base)` (preflight — reset CSS : `margin/padding/border` à 0 sur `*`, puces supprimées, `h1`-`h6` à `font-size:inherit`, liens sans couleur/soulignement…), qui s'applique à toute la page et casse le thème vanilla du wiki entier (vécu 2026-07 sur ce projet). Toujours passer par l'import sélectif theme+utilities, qui saute le layer base. Tailwind v4 = config CSS-first via `@theme`, détection de contenu automatique : aucun `postcss.config.js` ni `tailwind.config.js` nécessaire.

**Patch pnpm conservé.** Sans patch, `packup.ts`/`dist/js/packup.js`/`dist/index.js` réécrivent un `tailwind.config.js` v3 (`module.exports = {...}`) à chaque `dev`/`build` s'il est absent — **vestige mort** (rien ne le relit ; le pipeline réel utilise `@tailwindcss/postcss` v4, et ici Tailwind est de toute façon désactivé). On garde donc le patch qui supprime ce comportement, pour ne pas polluer le repo d'un fichier régénéré. Patché via `pnpm patch tiddlywiki-plugin-dev@0.5.12` (suppression du bloc `if (!fs.existsSync(tailwindConfigPath))` dans les deux fichiers compilés) ; enregistré dans `pnpm-workspace.yaml` (`patchedDependencies`) + `patches/tiddlywiki-plugin-dev@0.5.12.patch`.

**Version figée en exact** (`"tiddlywiki-plugin-dev": "0.5.12"`, sans `^`) dans `package.json` : un bump vers une version non `0.5.12` ferait échouer `pnpm install` (patch non applicable) — repatcher manuellement après un upgrade volontaire (même procédure). Même patch appliqué à l'identique dans `TW-TiddlyDev-Math` (dépôt séparé, pas de workspace pnpm partagé). Correctif amont possible sur `tiddly-gittly/plugin-dev-cli` (faire écrire ce fichier seulement si Tailwind est réellement utilisé) — non fait.

## 3b. Svelte + Sass ajoutés (2026-07)
Le moteur câble déjà `esbuild-svelte` + `svelte-preprocess` et un pipeline SCSS/Less/Stylus, mais sans exposer les paquets au projet (cf. `guides/styles-et-composants-avances.md`). Ajoutés en devDependencies : `svelte` (5.x), `sass`, `svelte-preprocess` (les peers requis pour `<script lang="ts">` + `<style lang="scss">`, `typescript` étant déjà présent). Ajouté aussi :

- `src/plugin-name/Example.svelte` — composant d'exemple (runes Svelte 5 `$props`/`$state`, `<style lang="scss">` avec `@use 'sass:color'`, variables, nesting). **Non câblé** : pas de `.meta`, et son import dans `index.ts` est commenté → le moteur ne le bundle pas tant qu'on ne l'active pas.
- `index.ts` : bloc commenté montrant l'usage (`import { mount } from 'svelte'` + `mount(Example, { target, anchor, props })`). Svelte 5 → API `mount()`/`unmount()` (le `new Component({ target })` de Svelte ≤4 est legacy).
- `src/global.d.ts` : déclarations de modules `*.scss` et `*.svelte`.

## 4. Passage à pnpm + mise à jour des deps (2026-07)
`package-lock.json` (npm) supprimé au profit de `pnpm-lock.yaml`, 11 paquets bumpés via `pnpm run update` (`tiddlywiki-plugin-dev` 0.5.7→0.5.12, `tiddlywiki` 5.3.8→5.4.0, `eslint-config-tidgi` 2.2.0→3.1.0, etc.).

**Gotcha pnpm 11** : cette version approuve les scripts de build via le bloc `allowBuilds:` (valeurs booléennes) de `pnpm-workspace.yaml`, et ignore l'ancien `onlyBuiltDependencies:` hérité du template. Les builds natifs de confiance (`esbuild`, `@parcel/watcher`, `dprint`, `svelte-preprocess`, `unrs-resolver`) sont donc passés à `true` — sans quoi `pnpm install` sort en `ERR_PNPM_IGNORED_BUILDS` et `esbuild` reste sans binaire (build cassé).

## 5. `src/plugin-name/tree.tid` supprimé (2026-07)
Faisait partie du gabarit de base (tiddler `$:/plugins/.../tree` affichant l'arborescence des fichiers du plugin via la macro core `<<tree>>`). Retiré comme superflu ; hérité par toute copie du gabarit. On a le plugin `nikorion/TW-Plugin-Info-Tree` qui surcharge le core pour rendre l'arbre directement en lieu et place de la liste plate dans les onglets de la vue du plugin.

## 6. Plugins bundlés du wiki de dev retirés
- `$:/plugins/Modern.TiddlyDev/doc` — readme + tutoriels du template, mentionnant entre autres le miroir npm chinois (cf. écart 2).
- `Gk0Wk/CPL-Repo` — navigateur de bibliothèque de plugins communautaires (config `popup-readme-at-startup`).

`wiki/tiddlers/` ne contient plus que `system/`, `tests/` (voir aussi écart 7).

## 7. Patch `lingo` retiré (2026-07)
`wiki/tiddlers/patches/lingo.tid` supprimé (le dossier `wiki/tiddlers/patches/` disparaît). Ce tiddler surchargeait le `$:/core/macros/lingo` par une version à 2 arguments `<<lingo <clé> <base>>>` avec repli `<base>/<code-langue>/<clé>` — nécessaire tant que le core ne supportait pas ce format.

Vérification (clone TiddlyWiki5, 2026-07) : le `lingo` du core est toujours mono-argument (`\define lingo(title)` → `{{$(lingo-base)$$title$}}`), et la PR amont #7821 (« translatable plugins ») a été **revertée** (commit `Revert #7821`). Le repli multi-langue n'est donc pas dans le core 5.4.x.

Comme le template est anglais-only (écart 1), on n'a plus besoin du repli : le plugin démo a été rebasculé sur le `lingo` du core en pointant `lingo-base` directement sur le dossier de langue :

- `src/plugin-name/configs/config.tid`, `src/plugin-name/readme.tid`, `src/plugin-name/language/en-GB/Readme.tid` : `\define lingo-base()` = `$:/plugins/your-name/plugin-name/language/en-GB/`, puis `<<lingo Clé>>` (mono-argument core).
- `config.tid` — le champ `caption` est rendu **hors** de la portée du corps (liste d'onglets du ControlPanel), donc son ancien `<<lingo Name <base>>>` auto-porté n'a pas d'équivalent mono-argument : remplacé par une transclusion directe `{{$:/plugins/your-name/plugin-name/language/en-GB/Name}}`.

Si un jour on veut un plugin **multi-langue**, il faudra soit réintroduire un `lingo.tid` maison, soit attendre une réintégration amont du format à repli.
