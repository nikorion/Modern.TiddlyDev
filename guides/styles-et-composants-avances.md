# Styles avancés & composants Svelte — `tiddlywiki-plugin-dev`

Fonctionnalités du moteur `tiddlywiki-plugin-dev` câblées au niveau engine (`packup.ts`). Dans ce template, les paquets requis (`sass`, `svelte`, `svelte-preprocess`) sont **désormais installés** (écart local 3b) et un composant d'exemple `src/plugin-name/Example.svelte` est fourni (non câblé : import commenté dans `index.ts`). Ce guide reste la référence pour les activer réellement.

## Repère technique — sous le capot
Construit avec **Modern.js** (`@modern-js/module-tools`) — origine probable du nom « Modern.TiddlyDev ». Dépendances internes notables :
- `esbuild` — compilation TS→JS + bundling
- `chokidar` + `ws` — watch + live-reload en mode `dev`
- `esbuild-style-plugin` (+ `@tailwindcss/postcss`, `autoprefixer`, `postcss-import`) — pipeline CSS, Tailwind v4 (cf. `ecarts-upstream.md` écart 3) ; support additionnel less/sass/stylus
- `esbuild-svelte` + `svelte-preprocess` — composants Svelte
- `simple-git` — opérations git de `publish`
- `inquirer` — prompts interactifs de `new`/`init`
- `commander` — parsing CLI

## Activer sass / less / stylus
`esbuild-style-plugin` détecte l'extension du fichier importé (`.css`, `.sass`, `.scss`, `.less`, `.styl`) et `import()` dynamiquement le transpileur correspondant (`sass`, `less` ou `stylus`) — **ce paquet n'est pas fourni par `tiddlywiki-plugin-dev`**, il doit être présent dans les dépendances du projet.

1. `pnpm add -D sass` (**déjà fait ici**) — ou `less`/`stylus` selon le besoin.
2. Renommer/écrire le fichier de styles avec l'extension voulue, ex. `index.scss` au lieu de `index.css`.
3. L'importer depuis le `.ts` du widget exactement comme `index.css` : `import "./index.scss";`.

Le fichier passe alors par le transpileur puis par le même pipeline PostCSS que le CSS classique. Tailwind est désactivé dans ce template mais son piège `layer(base)` (documenté dans `ecarts-upstream.md` écart 3) reste valable quel que soit le préprocesseur si on le réactive.

## Utiliser un composant Svelte
`esbuild-svelte` + `svelte-preprocess` sont déjà câblés dans le moteur, mais **`svelte` lui-même n'est pas exposé au projet** (dépendance interne à `tiddlywiki-plugin-dev`, non hoistée par pnpm — cohérent avec la prévention des « phantom dependencies »). Le code compilé d'un composant `.svelte` importe `svelte/internal` au moment du bundling ; sans `svelte` déclaré dans le projet, la résolution échoue.

1. `pnpm add -D svelte svelte-preprocess` (**déjà fait ici** ; `svelte` 5.x installé). Le code compilé importe `svelte/internal`, d'où le besoin de `svelte` déclaré dans le projet.
2. Écrire le composant, ex. `src/plugin-name/Example.svelte` (fourni comme exemple dans ce template).
3. L'importer et le **monter** depuis le widget TS, ex. dans `render()` — **API Svelte 5** :
   ```typescript
   import { mount, unmount } from "svelte";
   import Example from "./Example.svelte";
   // ...
   const component = mount(Example, {
     target: parentDomNode,
     anchor: nextSibling,       // insère avant nextSibling (comme insertBefore)
     props: { label: "…" },
   });
   // penser à unmount(component) dans destroy()/removeChildDomNodes() du widget.
   ```
   ⚠ En Svelte 5, l'ancienne API classe `new Example({ target, props })` (Svelte ≤4) est **legacy** — utiliser `mount()`/`unmount()`.
4. `svelte-preprocess` (config par défaut) permet `<script lang="ts">` et `<style lang="scss">` dans le `.svelte` — mais chaque préprocesseur utilisé (`sass`, `less`, `stylus`, `coffeescript`, `pug`…) est un peer optionnel de `svelte-preprocess` : à ajouter en dépendance du projet si utilisé (ici `sass` est présent ; `typescript` aussi).

Le composant `Example.svelte` du template (runes `$props`/`$state`, `<style lang="scss">` avec `@use 'sass:color'`) sert de point de départ. Non encore validé au runtime dans un widget TW (import commenté par défaut) — à confirmer à la première activation réelle.
