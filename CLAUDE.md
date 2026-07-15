# Modern.TiddlyDev — contexte projet pour Claude

## Ce que c'est
Template de plugin TiddlyWiki en **TypeScript** — copie locale du template officiel [Modern.TiddlyDev](https://tiddly-gittly.github.io/Modern.TiddlyDev/) (`tiddly-gittly/Modern.TiddlyDev`), basé sur le moteur/CLI `tiddlywiki-plugin-dev`. Plugin de démo : widget `<$RandomNumber>` (compteur de clics). But : point de départ pour plugins TW5 TypeScript avec outillage moderne (Playwright, ESLint, Husky).

**Ne vient PAS d'oeyoews / `create-neotw-app`** (l'ancien nom `tiddlywiki-starter-kit` le laissait croire à tort) — contenu vérifié identique fichier par fichier au master `tiddly-gittly/Modern.TiddlyDev` (2026-07), d'où les renommages successifs `tiddlywiki-starter-kit` → `Modern-TiddlyDev-Template` → `TiddlyDev` (2026-07-04) → `Modern.TiddlyDev` (2026-07-15). Généalogie ci-dessous.

Plugin courant : `$:/plugins/your-name/plugin-name` — à remplacer lors de la création d'un vrai plugin.

## Généalogie & dénominations
Détail complet : [CLAUDE.md du workspace](../CLAUDE.md) (tableau « Dénominations de l'écosystème »). L'essentiel :

- **Modern.TiddlyDev** (`tiddly-gittly/Modern.TiddlyDev`) — fondation, origine réelle de ce dossier : template GitHub officiel (bouton « Use this template » / degit) pour plugins TW5 TypeScript. Scaffoldable en CLI via `npx tiddlywiki-plugin-dev init <projet>` — distinct de `tiddlywiki-plugin-dev new` (`pnpm run new`), qui ajoute un plugin supplémentaire dans un projet existant.
- **tiddlywiki-plugin-dev** — paquet npm (auteur `Sttot`) ; dépôt GitHub source différent : `tiddly-gittly/plugin-dev-cli`. Consommé en `dependencies` (pas `devDependencies` : binaire nécessaire hors dev, pour `build`/`publish`). Exécute les scripts `dev`/`dev:lan`/`dev:wiki`/`build`/`test`/`publish`/`new`, et `npx tiddlywiki-plugin-dev init` (scaffolding). Peer-dep obligatoire : `tiddlywiki >=5.2.0`. Version épinglée exacte `0.5.12` ici (patch pnpm, cf. écarts locaux #3). Stack interne : voir `guides/styles-et-composants-avances.md`.
- **oeyoews/tiddlywiki-starter-kit** (= `npm create neotw-app`) — projet distinct, **NON utilisé ici**, PAS un fork git de Modern.TiddlyDev (vérifié API GitHub : `fork:false`). Modèle de wiki de notes local-first, bâti sur le même `tiddlywiki-plugin-dev`. Son nom « starter-kit » avait été repris par erreur pour ce dossier.
- **Ce dossier** — copie locale figée du template Modern.TiddlyDev (identique fichier par fichier au master, 2026-07 : `wiki/`, Tailwind, Playwright, dprint, workflows gh-pages en viennent tous), à dupliquer par robocopy pour tout nouveau projet (procédure dans le CLAUDE.md du workspace).

## Écarts locaux vs upstream Modern.TiddlyDev
Rationale complète dans `guides/ecarts-upstream.md`. Résumé :

| # | Écart | Point clé |
|---|---|---|
| 1 | Anglais uniquement | zh-Hans retiré (langue, LanguageSwitcher, bascule startup) — gadgets démo, hors i18n plugin |
| 2 | Registre npm officiel | miroir chinois retiré de `.npmrc` |
| 3 | Tailwind désactivé | imports `@import "tailwindcss/…"` commentés dans `index.css` + utilitaires démo retirés du bouton (`index.ts`) ; **patch pnpm conservé** (empêche le moteur de régénérer un `tailwind.config.js` v3 mort) ; version pinnée exacte `0.5.12` |
| 3b | Svelte + Sass ajoutés | `svelte` (5.x), `sass`, `svelte-preprocess` en devDependencies ; composant d'exemple `Example.svelte` (`<script lang="ts">` + `<style lang="scss">`) avec usage commenté dans `index.ts` |
| 4 | pnpm + deps à jour | `pnpm-lock.yaml` ; `allowBuilds:` (pas `onlyBuiltDependencies:`) dans `pnpm-workspace.yaml`, sinon `ERR_PNPM_IGNORED_BUILDS` |
| 5 | `tree.tid` supprimé | macro core `<<tree>>` jugée superflue |
| 6 | Plugins bundlés retirés | `$:/plugins/Modern.TiddlyDev/doc` (readme/tutoriels amont) + `Gk0Wk/CPL-Repo` (navigateur bibliothèque plugins) |
| 7 | Patch `lingo` retiré | `wiki/tiddlers/patches/lingo.tid` supprimé ; démo (`settings.tid`, `readme.tid`, `language/en-GB/Readme.tid`) rebasculée sur le `lingo` mono-argument du core, `lingo-base` pointé directement sur `…/language/en-GB/` |

Hérités du gabarit, à conserver :
- `pnpm run build` produit `dist/$__plugins_….json` : tiddler JSON **autoporteur** (`title`, `plugin-type`, `type`, `version` inclus) — importable par glisser-déposer dans un wiki navigateur, ou copiable tel quel dans `tiddlers/` d'un wiki Node sans `.meta` (contrairement au format brut `{"tiddlers":…}` des plugins classiques, ex. l'ancien CPL-Repo — écart 7).

## Déploiement du plugin — rupture avec le workflow symlink
Rupture vs plugins JS maison (TW-Math & co) : sources TypeScript non chargeables par TiddlyWiki tel quel → plus de symlink `TIDDLYWIKI_PLUGIN_PATH` vers `src/<plugin>/`.

- À la place : après `pnpm build`, copier le JSON autoporteur de `dist/` directement dans `tiddlers/` des wikis cibles (pas de `.meta`) — automatisable en post-build.
- Attention : c'est un artefact de build déployé, pas les sources — TS modifié sans rebuild = wikis périmés.
- À trancher (suggestion en attente) : garder l'ancien template maison (JS IIFE, symlink direct via `TIDDLYWIKI_PLUGIN_PATH`) pour les plugins légers plutôt que tout migrer en TS ?

## Guides détaillés (à lire à la demande — non chargés auto)
- `guides/tuto-template.md` — tutoriel d'utilisation (adaptation FR du README/tutoriels amont) : prérequis, install, workflow, création de widget, styles, i18n, config, tests, build & publication.
- `guides/ecarts-upstream.md` — rationale complète des écarts vs upstream (table ci-dessus).
- `guides/styles-et-composants-avances.md` — sass/less/stylus et composants Svelte ; `svelte`+`sass`+`svelte-preprocess` désormais installés + exemple `Example.svelte` (voir écarts 3b) ; repère technique interne `tiddlywiki-plugin-dev`.
- `guides/portage-plugin-js-vers-ts.md` — convertir un plugin JS « maison » (modules IIFE/CommonJS) vers ce template TS : modules JS→TS, sidecar `.ts.meta`, dépendance npm vs vendoring d'une lib CDN hors-npm, pièges (méthode générique).
- `guides/exemple-portage-tw-math.md` — application concrète de ce guide : TW-Math (JS) → TW-TiddlyDev-Math (TS), architecture obtenue et pièges spécifiques à ce portage.

## Structure
```
src/
  global.d.ts                    ← déclarations TS globales (tw5-typed + modules CSS / SCSS / Svelte)
  plugin-name/                   ← sources du plugin (seul dossier à toucher)
    index.ts                     ← widget principal ExampleWidget (export RandomNumber) ; contient l'usage Svelte commenté
    index.ts.meta                ← marqueur d'entrée : désigne index.ts comme entry point TW
    index.css                    ← styles du widget (importé dans index.ts) ; imports Tailwind commentés (désactivé)
    Example.svelte               ← composant Svelte+SCSS d'exemple (non câblé : pas de .meta, import commenté dans index.ts)
    plugin.info                  ← métadonnées du plugin (titre, auteur, version…)
    settings/
      settings.tid               ← onglet ControlPanel avec cases à cocher / selects / inputs
      settings.multids           ← valeurs par défaut des configs (tiddlers $:/plugins/…/settings/*)
    language/
      en-GB/
        Readme.tid               ← readme anglais embarqué dans TW
        Translations.multids     ← chaînes i18n (clés Name, Description, Configs/…)
    readme.tid                   ← readme affiché dans le gestionnaire de plugins TW

wiki/                            ← wiki TW de développement
  tiddlywiki.info                ← config : plugins chargés, port, targets build
  tiddlers/
    tests/playwright/
      example-widget.spec.ts     ← test Playwright : rendu initial du widget
      example-widget-click.spec.ts ← test Playwright : comportement au clic

dist/                            ← généré par pnpm build, gitignored
playwright.config.ts             ← config Playwright (baseURL :8080, testDir, webServer)
tsconfig.json                    ← TS strict, NodeNext modules, types tw5-typed
eslint.config.mjs                ← config ESLint (preset eslint-config-tidgi)
.prettierrc / dprint.json        ← formatage (dprint prioritaire)
(pas de tailwind.config.js)      ← le patch pnpm empêche le moteur de le régénérer (vestige v3 mort, Tailwind désactivé — écart 3)
```

## Workflow dev
```bash
pnpm install
pnpm dev             # TW sur :8080 + hot reload TypeScript
pnpm dev:lan         # idem, accessible sur le réseau local
pnpm dev:wiki        # mode write-wiki (persiste les changements dans wiki/)
pnpm check           # vérification TypeScript sans build (tsc --noEmit)
pnpm lint            # ESLint sur src/
pnpm lint:fix        # ESLint avec auto-fix
pnpm build           # compile et génère dist/ (plugin JSON + wiki HTML)
pnpm run publish     # build + package pour CPL/publication (« run » obligatoire : `pnpm publish` seul = commande pnpm de publication npm)
pnpm test            # lance les tests via tiddlywiki-plugin-dev
pnpm test:playwright        # tests E2E Playwright (sans headed)
pnpm test:playwright:headed # avec navigateur visible
pnpm test:playwright:debug  # mode debug Playwright
```

`pnpm dev` utilise `tiddlywiki-plugin-dev dev`, qui :
- compile TypeScript → JS en watch mode
- lance TiddlyWiki sur `http://127.0.0.1:8080`
- recharge automatiquement à chaque changement de fichier

## Architecture du widget (src/plugin-name/index.ts)
```typescript
class ExampleWidget extends Widget {
  render(parent, nextSibling)   // crée le DOM, attache les listeners
  refresh(_changedTiddlers)     // retourne false si pas besoin de re-render
}
exports.RandomNumber = ExampleWidget;
```

**Règle clé — nom du widget = nom de la variable exportée.** Le tag TW `<$RandomNumber/>` correspond à `exports.RandomNumber`, pas au nom de la classe ni au nom du fichier. La triade `nom de tiddler` / `nom de fichier source` / `nom du widget` peut être entièrement différente.

Le fichier `index.ts.meta` contient :
```
title: $:/plugins/your-name/plugin-name/test-widget.ts
type: application/javascript
module-type: widget
```
C'est ce `.meta` qui désigne `index.ts` comme entry point TW. Sans lui, le fichier est ignoré par le bundler.

## i18n — fichiers .multids
Format `.multids` : un seul fichier crée plusieurs tiddlers.
```
title: $:/plugins/your-name/plugin-name/language/en-GB/

Name: Mon Plugin
Description: Description courte
Configs/XXX/Caption: Paramètre X
```
Les clés sont référencées via le `lingo` mono-argument du core : définir `\define lingo-base()` = `$:/plugins/your-name/plugin-name/language/en-GB/` en tête de tiddler, puis `<<lingo Name>>`. Hors portée du corps (ex. champ `caption`), transclure directement : `{{$:/plugins/your-name/plugin-name/language/en-GB/Name}}`. (Le core est mono-langue ici — anglais uniquement, écart 1 ; l'ancien patch `lingo` à repli multi-langue a été retiré, écart 7.)

## Config tiddlers (settings/)
- `settings.multids` crée les tiddlers `$:/plugins/…/settings/xxx`, `…/yyy`, `…/zzz` avec leurs valeurs par défaut.
- `settings.tid` affiche un onglet dans le ControlPanel TW (tag `$:/tags/ControlPanel/SettingsTab`).
- Les widgets TW natifs `<$checkbox>`, `<$select>`, `<$edit-text>` lisent/écrivent directement les tiddlers de config.

## Tests Playwright
- Specs dans `wiki/tiddlers/tests/playwright/` (inclus dans `tsconfig.json`).
- `playwright.config.ts` démarre automatiquement `pnpm dev` avant les tests si le serveur n'est pas déjà lancé.
- BaseURL : `http://127.0.0.1:8080`, timeout : 30 s, retries CI : 2.
- Les tests naviguent vers un tiddler (`/#PlaywrightExampleWidget`) et interrogent le DOM via locators CSS.
- CI : `pnpm test:playwright` ; en local le serveur dev peut être réutilisé (config `reuseExistingServer`).

## TypeScript — points importants
- `tw5-typed` fournit les types TiddlyWiki (`Widget`, `IChangedTiddlers`, `$tw`, etc.).
- `src/global.d.ts` référence `tw5-typed` et déclare les modules `*.css`, `*.scss` et `*.svelte` (import direct possible).
- `module: "NodeNext"` + `moduleResolution: "NodeNext"` dans tsconfig — les imports doivent inclure l'extension.
- Pattern standard d'export d'un widget : `declare let exports: { … }; exports.X = ClassX;` (pas `export default` ni `export class`).

## Conventions
- Dossier source du plugin : `plugin-name/` — à renommer avec le vrai nom à la création d'un plugin réel.
- Wiki de dev : `wiki/`.
- Imports CSS dans les fichiers TS bundlés automatiquement par `tiddlywiki-plugin-dev`.
- Husky + lint-staged : ESLint tourne automatiquement sur les fichiers TS/JS stagés avant chaque commit.
- Formatter principal : **dprint** (pas Prettier, bien que `.prettierrc` soit présent).

Pièges Windows (BOM UTF-8, Unicode PowerShell, CRLF dans les here-strings) : [CLAUDE.md de TW-Math](../TW-Math/CLAUDE.md#pièges-powershell--leçons-apprises).
