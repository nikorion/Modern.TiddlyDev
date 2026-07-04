# Exemple de portage : TW-Math (JS) → TW-TiddlyDev-Math (TS)

Application concrète de la méthode décrite dans [`portage-plugin-js-vers-ts.md`](portage-plugin-js-vers-ts.md), sur un vrai plugin nikorion : **TW-Math** (widget `<$math>` intégrant mathjs) porté en **TW-TiddlyDev-Math**, banc d'essai (pas le plugin de production — c'est toujours `TW-Math`).

- Contexte du projet : `TW-TiddlyDev-Math/` — **même identité TW** que TW-Math (`$:/plugins/nikorion/math`) ; **non symlinké** (`TIDDLYWIKI_PLUGIN_PATH`) pour éviter un conflit d'identité avec le symlink `math` → `TW-Math/src/math/`. Se teste via son propre wiki de dev / build.
- Portage **expérimental et réussi**, confirmé en Playwright headless (KaTeX, notation scientifique/binaire, scope inline, unités, précision BigNumber) — pas seulement `tsc --noEmit`.

---

## Architecture obtenue

`TW-Math` avait 9 modules JS (`cache.js`, `format.js`, `lang.js`, `mathinstance.js`, `normalize.js`, `prettyprint.js`, `renderer.js`, `scope.js`, `math.widget.js`), chacun un tiddler `library` référencé par titre absolu (`require("$:/plugins/nikorion/math/modules/lang.js")`), plus `math.min.js` (mathjs **vendoré à la main**, bundle CDN collé, ~650 Ko) — l'exemple qui a servi de base à l'étape « vendoring CDN » du guide générique.

Côté TS, un seul point d'entrée `src/math/modules/math.widget.ts` + `.meta` (`title: $:/plugins/nikorion/math/modules/math.widget.js`, `module-type: widget`). Les 8 autres modules deviennent de simples `.ts` importés par ES `import` (ex. `import * as lang from "./lang.js"`), **sans `.meta`** — esbuild les bundle tous dans l'unique tiddler compilé. `math.min.js` est remplacé par la dépendance npm réelle `mathjs@15.2.0` : `import { all, create, type MathJsInstance } from "mathjs"` dans `mathinstance.ts` (`create(all, config)`) — la voie (a) « npm » du guide générique a été préférée à la voie (b) « vendoring », mathjs étant disponible sur npm.

Résultat : **9 tiddlers JS → 1 seul** (`math.widget.js`, ~825 Ko, mathjs inclus). Les tiddlers non-JS (`.tid`, `.multids`, `icon.svg` + `.meta`, `styles.css`) sont copiés tels quels — chargés par le loader natif de TW, indépendant d'esbuild.

## Pièges rencontrés spécifiques à ce portage

En plus des pièges génériques listés dans `portage-plugin-js-vers-ts.md` (NodeNext, `tw5-typed`, `browserslist`, signatures widget) :

- **`"Modern.TiddlyDev#BrowsersList": "defaults"` requis dans `plugin.info`** — sans ce champ, le préset `browserslist` par défaut du moteur a fait échouer le build de mathjs (ESM moderne) avec 388 erreurs `Transforming destructuring ... is not supported yet` (cible trop ancienne, type iOS 11). Appliqué dans `TW-TiddlyDev-Math/src/math/plugin.info`.
- **Caractères Unicode invisibles** (NNBSP, NBSP, espace fine) corrompus à l'écriture via l'outil d'édition — écho du piège documenté dans [TW-Math/CLAUDE.md](../../TW-Math/CLAUDE.md#pièges-powershell--leçons-apprises).

## Workflow & structure

Identiques au template : voir le [CLAUDE.md du template](../CLAUDE.md) (scripts `pnpm dev`/`build`/`check`, wiki de dev `wiki/`, patch pnpm, déploiement du JSON autoporteur de `dist/`). Sources du plugin : `TW-TiddlyDev-Math/src/math/` (modules TS dans `src/math/modules/`).
