# Porter un plugin TW « maison » (JS) vers TypeScript avec `tiddlywiki-plugin-dev`

Guide générique pour convertir un plugin TiddlyWiki écrit en **JS classique** (modules IIFE/CommonJS, chargés par le système de modules TW) vers le workflow **TypeScript** de ce template (Modern.TiddlyDev / `tiddlywiki-plugin-dev` / esbuild).

Cas d'école réel : le portage de **TW-Math** (9 modules JS) → **TW-TiddlyDev-Math** (TS). Application concrète dans [`exemple-portage-tw-math.md`](exemple-portage-tw-math.md) ; ce guide-ci en extrait la partie réutilisable.

---

## 1. Convertir les modules JS → TS

Un plugin JS « maison » a typiquement N modules, chacun étant un **tiddler indépendant** : un `.js` avec un en-tête TW inline et des `require`/`exports`. En TS, ces modules deviennent de simples `.ts` qu'esbuild bundle.

| Aspect | Plugin JS | Plugin TS (ce template) |
|---|---|---|
| Fichier module | `foo.js` | `foo.ts` |
| En-tête par fichier | `/*\ title / type / module-type: library \*/` dans chaque `.js` | **Aucun en-tête** dans les modules importés (voir §2) |
| Résolution de module | `require("$:/plugins/auteur/plugin/modules/foo.js")` (titre **absolu** de tiddler) | `import * as foo from "./foo.js"` (chemin **relatif**) |
| Export | `exports.foo = …` | `export …` |
| Wrapper | `(function(){ "use strict"; … })()` par module | Aucun — esbuild s'en charge |
| Typage | JS + JSDoc | Types TS réels |

**Effondrement N tiddlers → 1.** En JS, chaque module est un tiddler séparé qui référence les autres par titre absolu. En TS, **seul le point d'entrée porte un `.meta`** (§2) ; esbuild bundle tous ses imports (transitifs, dépendances npm comprises) dans **un unique tiddler compilé**. Les anciens modules `library` disparaissent en tant que tiddlers autonomes.

**Piège NodeNext — extension `.js` obligatoire.** Le `tsconfig.json` du template est en `module`/`moduleResolution: "NodeNext"` : tout import relatif doit inclure l'extension `.js`, **même si le fichier source est `.ts`** :

```typescript
import * as foo from "./foo.js";   // ✅  (le fichier réel est foo.ts)
import * as foo from "./foo";      // ❌
```

**Tiddlers non-JS inchangés.** `.tid`, `.multids`, images (`icon.svg` + `.meta`), `.css` sont copiés tels quels : le loader natif de TW les charge, indépendamment d'esbuild. Seul le **code** (modules) passe par la compilation.

---

## 2. Le point d'entrée (widget) a besoin d'un sidecar `.ts.meta`

Un fichier TS ne devient un **point d'entrée** (compilé + doté des métadonnées de module TW) que s'il est accompagné d'un `.meta` de même nom. Pour un widget `MonWidget.ts`, créer `MonWidget.ts.meta` :

```
title: $:/plugins/your-name/plugin-name/modules/MonWidget.js
type: application/javascript
module-type: widget
```

- Le `title` du `.meta` finit en **`.js`** (l'artefact compilé), pas `.ts`.
- Le nom du widget (`<$xxx>`) vient de la **variable exportée** (`exports.xxx = MonWidget`), pas du nom de fichier ni de la classe.
- Pattern d'export TS : `declare let exports: { xxx: typeof MonWidget }; exports.xxx = MonWidget;` (pas `export default` ni `export class`).
- **Règle : 1 `.meta` = 1 point d'entrée.** Les modules importés par le widget n'ont **pas** de `.meta` — leur en ajouter un les empaquèterait **en double** (une fois comme entrée, une fois dans le bundle). Un plugin à un seul widget n'a qu'un seul `.ts.meta`.

D'autres `module-type` prennent aussi un `.meta` s'ils doivent être des entrées propres (`macro`, `startup`, `filteroperator`, `parser`…) ; sinon, les laisser en simples fichiers importés.

---

## 3. Dépendances externes : npm vs vendoring d'un CDN

Deux façons d'embarquer une lib tierce.

### a) Elle est sur npm → dépendance npm (le plus simple)

`pnpm add <lib>`, puis `import … from "<lib>"`. Types officiels, mises à jour via `pnpm update`. esbuild la bundle dans le tiddler d'entrée. **À préférer quand c'est possible.**

> ⚠ Une lib ESM moderne peut faire échouer le build à cause de `browserslist` (voir §4, piège 4).

### b) Elle n'existe **que** sur un CDN (pas dans le registre npm) → vendoring

But : embarquer la lib **sans aucune dépendance npm** (code + types dans le repo, zéro accès réseau à l'install, au build, ou pour l'utilisateur final). Quatre fichiers :

**Étape 1 — coller le bundle CDN dans un `.js` (module `library`).**

1. Ouvrir l'URL du CDN dans un navigateur, ex. `https://cdn.jsdelivr.net/npm/<lib>@<version>/…/<lib>.min.js`.
2. Copier tout le contenu.
3. Le coller dans un `.js` **sous un en-tête de tiddler TW** :
   ```
   /*\
   title: $:/plugins/your-name/plugin-name/modules/lib.min.js
   type: application/javascript
   module-type: library
   \*/
   … bundle UMD collé tel quel (finit souvent par `module.exports = …;`) …
   ```
4. Committer : versionné et bundlé avec le plugin, sans dépendance réseau.

**Étape 2 — interface de types maison (`lib-types.ts`).** Ne typer **que ce que le plugin utilise réellement** (le reste peut rester `any`) :

```typescript
// src/plugin-name/modules/lib-types.ts
export interface LibInstance {
  doThing(input: string): unknown;
  // … uniquement les méthodes appelées par le plugin
}
```

**Étape 3 — déclarer le module vendoré pour tsc (`lib.min.d.ts`).** Un `.d.ts` de **même nom de base** que le `.js` : quand un `.ts` importe `"./lib.min.js"`, tsc résout vers ce `.d.ts` pour les types, tandis qu'esbuild bundle le vrai `.js` au runtime.

```typescript
// src/plugin-name/modules/lib.min.d.ts
import type { LibInstance } from "./lib-types";
declare const lib: { create(config?: object): LibInstance };
export default lib;
```

**Étape 4 — adapter les imports, retirer la dép npm.**

```typescript
import libFactory from "./lib.min.js";
import type { LibInstance } from "./lib-types";
// … utiliser libFactory selon l'API du bundle UMD
```

Puis **supprimer la lib du `package.json`** (si elle y était). Tout — code + types — vit dans le repo.

> Exemple concret de ce process (mathjs vendoré depuis jsDelivr) : voir [`exemple-portage-tw-math.md`](exemple-portage-tw-math.md). TW-Math (JS) fonctionnait ainsi ; TW-TiddlyDev-Math lui a préféré la voie npm (a).

---

## 4. Pièges du portage (à relire avant de commencer)

1. **Caractères Unicode invisibles corrompus à l'écriture.** Taper des littéraux NNBSP (U+202F), NBSP (U+00A0), espace fine (U+2009) dans du code via un outil d'édition peut les transformer silencieusement en espace ASCII (invisible à l'œil ; détectable seulement en dumpant les code points). Les échapper explicitement (` `…) plutôt que taper le caractère brut, et vérifier après coup.
2. **NodeNext → extension `.js`** dans les imports relatifs (cf. §1).
3. **`tw5-typed` a des trous.** Ex. `Widget.domNodes` est typé `Element[]` alors que TW y pousse aussi des `TextNode` → cast `as unknown as Element` au point d'insertion. Attendre d'autres écarts ponctuels type/réalité.
4. **`browserslist` par défaut casse le build de libs ESM modernes.** `esbuild-plugin-browserslist` lit `Modern.TiddlyDev#BrowsersList` du `plugin.info` ; le préset par défaut (`>0.25%, not ie 11, not op_mini all`) peut cibler des navigateurs si anciens (iOS 11) qu'esbuild refuse de transpiler certaines syntaxes (déstructuration…). **Correctif : `"Modern.TiddlyDev#BrowsersList": "defaults"` dans `plugin.info`.**
5. **Signatures d'API widget légèrement différentes** (ex. `renderChildren()`/`makeChildWidget()` : params requis vs optionnels) — détecté par `pnpm check` (`tsc --noEmit --skipLibCheck`).

**Toujours valider par un test Playwright headless réel** en plus de `tsc --noEmit` : la compilation qui passe ne garantit pas le comportement runtime. Voir `guides/tuto-template.md` §14 (tests).
