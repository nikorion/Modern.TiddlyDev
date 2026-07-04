# Tutoriel — utiliser le template Modern.TiddlyDev

Adaptation française, simplifiée et condensée, des tutoriels du projet **Modern.TiddlyDev**
(dépôt d'origine : https://github.com/tiddly-gittly/Modern.TiddlyDev, tutoriels amont :
https://tiddly-gittly.github.io/Modern.TiddlyDev/).

Modern.TiddlyDev est un environnement clé en main pour développer des **plugins TiddlyWiki 5
en TypeScript** : serveur de dev à rechargement à chaud (WYSIWYG), build/publication en une
commande, ESLint + Prettier, esbuild, tests Playwright.

Ce guide décrit comment se servir de **ce** template une fois copié ; il complète le
[CLAUDE.md](../CLAUDE.md) du dossier (généalogie et écarts locaux). Les commandes sont
données en&nbsp;`pnpm` (le gestionnaire retenu ici) ; l'amont documente les mêmes en&nbsp;`npm`.

---

## 1. Prérequis

- **Node.js** (LTS récent) et **pnpm** (`npm i -g pnpm`).
- **git** (clone, commit, push…) et un compte **GitHub** si tu veux les builds/publications
  automatisés.
- Un éditeur type **VS Code** (extensions TiddlyWiki5 Syntax, ESLint, Prettier).
- Des bases HTML/CSS/JS/TS et un peu de pratique de TiddlyWiki. Le développement de widgets
  côté TW n'est pas couvert ici en détail → voir https://tiddlywiki.com/dev/.

## 2. Concepts fondamentaux

- Un **plugin est un tiddler** qui empaquette plusieurs autres tiddlers — c'est en gros un
  « zip » de tiddlers. Les tiddlers empaquetés sont appelés **shadow tiddlers**.
- Les shadow tiddlers n'existent pas seuls : ils sont chargés depuis le plugin. Si un tiddler
  normal porte **le même titre** qu'un shadow, il le **masque** (sans le supprimer) ; en
  supprimant le tiddler normal, le shadow réapparaît. C'est le mécanisme des **valeurs de
  config par défaut** : le défaut est un shadow, l'utilisateur le surcharge par un tiddler
  normal, et supprimer ce dernier restaure le défaut.
- Tous les shadow tiddlers sont stockés (JSON) dans le champ&nbsp;`text` du tiddler-plugin.
- **Nommage** : le titre du plugin doit suivre&nbsp;`$:/plugins/<auteur>/<plugin>`, et ses
  shadow tiddlers être préfixés par&nbsp;`$:/plugins/<auteur>/<plugin>/`.
- Variantes de plugin : **thème** (`$:/themes/`) et **pack de langue** (`$:/languages/`) —
  même mécanisme, finalités différentes.

## 3. Installation & démarrage

Depuis la racine du projet (là où est le&nbsp;`package.json`) :

```bash
pnpm install     # installe les deps, dont le moteur tiddlywiki-plugin-dev
pnpm dev         # compile + sert TiddlyWiki sur http://127.0.0.1:8080 + hot reload
```

> Un avertissement `Plugin(s) required for client-server operation are missing…` est
> **normal** en mode&nbsp;`dev` : le wiki est en lecture seule, tes essais dans le navigateur
> ne sont pas réécrits sur disque.

Le template contient déjà un plugin de démo&nbsp;`src/plugin-name/` (widget de démo). Pour le
voir : crée un tiddler et écris-y la balise du widget exporté (cf.&nbsp;`exports.…` dans
`index.ts`), par ex.&nbsp;`<$RandomNumber />`.

**Cycle WYSIWYG** : garde le serveur ouvert, modifie un fichier de&nbsp;`src/`, sauvegarde →
recompilation auto → rafraîchis le navigateur.

## 4. Éditer aussi le wiki (mode write)

`pnpm dev` est en lecture seule. Pour que les modifs faites **dans le navigateur** soient
persistées vers&nbsp;`wiki/` (utile pour rédiger la doc/les exemples) :

```bash
pnpm dev:wiki
```

Astuce : ouvre directement ton tiddler de test en éditant&nbsp;`wiki/tiddlers/$__DefaultTiddlers.tid`.

## 5. Structure du projet

```
src/
  global.d.ts        ← déclarations TS globales (référence tw5-typed + modules CSS)
  plugin-name/       ← LES SOURCES DU PLUGIN — seul dossier à toucher
    index.ts         ← le widget principal
    index.ts.meta    ← désigne index.ts comme entry point TW (indispensable)
    index.css        ← styles (importés dans index.ts)
    plugin.info      ← métadonnées du plugin (titre, auteur, version…)
    configs/         ← onglet ControlPanel + valeurs de config par défaut
    language/en-GB/  ← readme embarqué + chaînes i18n
    readme.tid       ← page de présentation du plugin
wiki/                ← wiki TW de développement (config, tiddlers, tests)
dist/                ← généré par pnpm build (gitignored)
```

Pour un vrai plugin, renommer&nbsp;`plugin-name/` et remplacer l'identité
`$:/plugins/your-name/plugin-name` partout.

## 6. Ajouter du contenu à un plugin (les tiddlers)

**a) Le plus simple — un fichier&nbsp;`.tid`** posé dans le dossier du plugin : entête
`champ: valeur`, une ligne vide, puis le corps.

```
title: $:/plugins/your-name/your-plugin/readme

Hello!
```

**b) Fichiers non-`.tid` (`.css`,&nbsp;`.js`, images…) → fichier&nbsp;`.meta` compagnon.** Sans
lui, un tel fichier soit est ignoré (dans ce template), soit reçoit un titre = chemin absolu,
et ne peut pas porter de métadonnées. On crée donc&nbsp;`example.png.meta` à côté de
`example.png` :

```
title: $:/plugins/your-name/your-plugin/example.png
type: image/png
tags: 12345
```

Le champ&nbsp;`type` est le **ContentType** TW. Les plus courants :

| Contenu | `type` |
|---|---|
| Code JavaScript |&nbsp;`application/javascript`&nbsp;|
| Données JSON |&nbsp;`application/json`&nbsp;|
| Feuille de style CSS |&nbsp;`text/css`&nbsp;|
| Dictionnaire de données |&nbsp;`application/x-tiddler-dictionary`&nbsp;|
| WikiText TW5 |&nbsp;`text/vnd.tiddlywiki`&nbsp;|
| HTML |&nbsp;`text/html`&nbsp;| Texte brut |&nbsp;`text/plain`&nbsp;|
| PNG / JPEG / GIF / SVG |&nbsp;`image/png`&nbsp;·&nbsp;`image/jpeg`&nbsp;·&nbsp;`image/gif`&nbsp;·&nbsp;`image/svg+xml`&nbsp;|

**c) Sous-dossiers** : autorisés ; TW lit les **fichiers** (un dossier vide n'apporte rien).

**d) Contrôle fin / exclusion —&nbsp;`tiddlywiki.files`.** En posant ce fichier JSON dans un
dossier, TW **cesse le scan automatique** de ce dossier et ne charge **que** ce que le fichier
décrit. Il permet d'inclure sélectivement des fichiers/sous-dossiers, de leur injecter des
`fields`, de générer des champs à partir du nom/de la date, etc. Points utiles :

- `tiddlers[]` : fichiers inclus (ceux absents sont exclus) ;&nbsp;`file` (requis),
 &nbsp;`fields`,&nbsp;`prefix`/`suffix` (préfixe/suffixe de contenu).
- `directories[]` : sous-dossiers, sous forme de chaîne, ou d'objet avec&nbsp;`path`,
 &nbsp;`filesRegExp` (filtre regex),&nbsp;`fields`,&nbsp;`isEditableFile` (si&nbsp;`true`, le
  tiddler est éditable et réécrit le fichier au lieu de créer une surcharge).
- Un&nbsp;`field` peut être un objet générateur&nbsp;`{ "source": …, "prefix": …, "suffix": … }`
  où&nbsp;`source` vaut&nbsp;`filename`,&nbsp;`basename`,&nbsp;`extname`,&nbsp;`created`,
 &nbsp;`modified`…
- Un&nbsp;`.meta` reste pris en compte et **prime** sur&nbsp;`fields` en cas de champ homonyme.

## 7. Développer un widget en TypeScript

Un **widget** est l'unité de rendu de TW (les&nbsp;`<$xxx />`). Pour en créer un, deux
fichiers : le script&nbsp;`MonWidget.ts` et son entry-marker&nbsp;`MonWidget.ts.meta`.

Le&nbsp;`.meta` déclare l'entry point :

```yaml
title: $:/plugins/<auteur>/<plugin>/MonWidget.ts
type: application/javascript
module-type: widget
```

Le script minimal :

```typescript
import { IChangedTiddlers } from 'tiddlywiki';
import { widget as Widget } from '$:/core/modules/widgets/widget.js';

class ExampleWidget extends Widget {
  refresh(_changedTiddlers: IChangedTiddlers) { return false; }
  render(parent: Node, nextSibling: Node) {
    this.parentDomNode = parent;
    this.execute();
    const el = $tw.utils.domMaker('p', { text: 'This is a widget!' });
    this.domNodes.push(parent.appendChild(el));
  }
}
exports.random = ExampleWidget;   // ← appelé via <$random />
```

**Règle clé — le nom du widget = le nom de la variable exportée** (`exports.random` →
`<$random />`), **pas** le nom de la classe ni du fichier. Les trois peuvent différer.

**Cycle de vie** (méthodes à surcharger selon les besoins) :

- `initialise(parent, options)` — init ; appeler&nbsp;`super.initialise(...)` puis
 &nbsp;`this.computeAttributes()` s'il y a des attributs.
- `execute()` — parsing avant rendu ;&nbsp;`this.makeChildWidgets()` pour supporter les enfants,
  puis lecture des attributs (`this.getAttribute('title')`…).
- `render(parent, nextSibling)` — crée le DOM ; **empiler tous les nœuds créés dans
 &nbsp;`this.domNodes`** (recyclage auto par TW) ;&nbsp;`this.renderChildren(...)` si enfants.
- `refresh(changedTiddlers)` — retourne&nbsp;`true`/`false` selon qu'un re-rendu a eu lieu ;
 &nbsp;`this.refreshSelf()` fait un re-rendu brutal, sinon&nbsp;`return this.refreshChildren(changedTiddlers)`.

Détails de l'API widget : https://tiddlywiki.com/dev/. Types fournis par
[tw5-typed](https://github.com/tiddly-gittly/TW5-Typed) (voir §12).

**Importer d'autres ressources depuis le TS.** Un script **avec**&nbsp;`.meta` est un entry
point (compilé). Un script **sans**&nbsp;`.meta` n'est pas compilé seul mais peut être
**importé** par un entry point — et tout ce qu'il importe (autres&nbsp;`.ts`,&nbsp;`.css`,
`.json`, images) est bundlé automatiquement, **sans&nbsp;`.meta`**.

```typescript
import './index.css';         // extrait → tiddler $:/tags/Stylesheet
import { foo } from './foo';  // foo.ts n'a pas besoin de .meta
```

> ⚠ Ne pas ajouter de&nbsp;`.meta` à une ressource déjà importée : elle serait empaquetée
> **deux fois**. Note :&nbsp;`.js` ne peut pas être un entry point, mais peut être importé.

## 8. Styles (CSS / SCSS ; Tailwind désactivé)

Par défaut, le widget est stylé en **CSS classique** :&nbsp;`index.css` est importé depuis
`index.ts` (`import './index.css';`) et extrait en tiddler&nbsp;`$:/tags/Stylesheet`.

**SCSS.** `sass` est déjà en&nbsp;`devDependencies` : renommer&nbsp;`index.css` en&nbsp;`index.scss`
et adapter l'import (`import './index.scss';`) suffit — le moteur transpile via&nbsp;`sass`.
Voir&nbsp;`guides/styles-et-composants-avances.md` (SCSS, composants Svelte, exemple
`Example.svelte`).

**Tailwind est désactivé ici** (écart local, cf.&nbsp;`ecarts-upstream.md`) : les imports sont
commentés dans&nbsp;`index.css`. Pour le réactiver, décommenter les **imports sélectifs**
`@import "tailwindcss/theme.css" layer(theme);` +&nbsp;`@import "tailwindcss/utilities.css"
layer(utilities);` — **ne jamais** utiliser&nbsp;`@import "tailwindcss";` seul (son&nbsp;`layer(base)`
applique un reset global qui casse le thème du wiki entier). Aucun&nbsp;`postcss.config.js` ni
`tailwind.config.js` nécessaire (v4 = config CSS-first).

## 9. Internationalisation — fichiers `.multids`

Le format&nbsp;`.multids` crée plusieurs tiddlers en un fichier :

```
title: $:/plugins/your-name/plugin-name/language/en-GB/

Name: Mon Plugin
Description: Description courte
Configs/XXX/Caption: Paramètre X
```

Référence via le&nbsp;`lingo` **mono-argument** du core : définir en tête de tiddler
`\define lingo-base()` =&nbsp;`$:/plugins/your-name/plugin-name/language/en-GB/`, puis
`<<lingo Name>>`. Hors portée du corps (ex. un champ&nbsp;`caption`), transclure directement :
`{{$:/plugins/your-name/plugin-name/language/en-GB/Name}}`. (Le patch&nbsp;`lingo` à repli
multi-langue du gabarit a été retiré — template anglais-only, cf.&nbsp;`ecarts-upstream.md`
écart 7.)

## 10. Tiddlers de configuration (`configs/`)

- `configs.multids` crée les tiddlers de config avec leurs valeurs par défaut (shadow →
  mécanisme de surcharge du §2).
- `config.tid` (tag&nbsp;`$:/tags/ControlPanel/SettingsTab`) ajoute un onglet dans le
  ControlPanel.
- Les widgets natifs&nbsp;`<$checkbox>`,&nbsp;`<$select>`,&nbsp;`<$edit-text>` lisent/écrivent
  directement ces tiddlers.

## 11. Stratégie de compilation (champs `Modern.TiddlyDev#…`)

À placer dans un&nbsp;`.meta` (par fichier) ou dans&nbsp;`plugin.info` (global) :

| Champ | Où | Effet |
|---|---|---|
|&nbsp;`Modern.TiddlyDev#IncludeSource: true`&nbsp;| .meta | Inclut aussi le **source** de l'entry (pas seulement le compilé). |
|&nbsp;`Modern.TiddlyDev#NoCompile: true`&nbsp;| .meta | N'compile pas ce script (à combiner avec&nbsp;`IncludeSource`). |
|&nbsp;`Modern.TiddlyDev#Minify: false`&nbsp;| plugin.info **ou** .meta | Désactive la minification (globale, ou par fichier ex.&nbsp;`.min.js`). |
|&nbsp;`Modern.TiddlyDev#SourceMap: false`&nbsp;| plugin.info | Contrôle le sourcemap en prod (inline en dev par défaut). |
|&nbsp;`Modern.TiddlyDev#ExternalModules: "fs [[foo bar]]"`&nbsp;| plugin.info | Exclut des modules/tiddlers du bundle (syntaxe esbuild ;&nbsp;`[[ ]]` pour titres à espaces, wildcard&nbsp;`abc/*` ok). |
|&nbsp;`Modern.TiddlyDev#NodeModulesNotExternal: ["url",…]`&nbsp;| plugin.info | Ré-inclut des modules Node exclus par défaut (corrige `Cannot find module 'url'`…). |
|&nbsp;`Modern.TiddlyDev#BrowsersList: "last 2 versions"`&nbsp;| plugin.info | Cible de compat (défaut&nbsp;`>0.25%, not ie 11, not op_mini all`). |

Rappel : par défaut, tous les modules Node **absents du navigateur** (`fs`,&nbsp;`url`,
`util`…) sont externalisés. `plugin.info` est du JSON strict (virgules, guillemets).

## 12. Champs générés au build

- `Modern.TiddlyDev#Origin` — sur chaque tiddler issu de la compilation, indique le fichier
  source d'origine.
- `Modern.TiddlyDev#SHA256-Hashed` — signature d'intégrité (sur les builds publish/build),
  = sha256 du plugin sérialisé en excluant ce champ lui-même.

## 13. `plugin.info` — champs principaux

- `title` **(requis)** —&nbsp;`$:/plugins/<auteur>/<plugin>`.
- `version` —&nbsp;`major.minor.patch` ; sert à la détection de mise à jour (⚠ **l'incrémenter
  à chaque release**). Vide → version de TW du build.
- `plugin-type` —&nbsp;`plugin` (défaut),&nbsp;`theme`,&nbsp;`language`,&nbsp;`library`…
- `name`,&nbsp;`description`,&nbsp;`author` — affichés dans le gestionnaire de plugins.
- `list` — sections affichées (`readme config`…), en titres **relatifs** (préfixe
  `$:/plugins/xxx/xxx/` retiré).
- `core-version` — version min. du core, ex.&nbsp;`>=5.2.0`.
- `dependents` — plugins dépendances (installés avec).
- `parent-plugin` — déclare un sous-plugin (regroupé sous le parent dans la bibliothèque).
- `source` — URL du dépôt ;&nbsp;`plugin-priority`,&nbsp;`text-direction`… (avancés).

## 14. Tests

- **Unitaires** : tiddler taggé&nbsp;`$:/tags/test-spec` +&nbsp;`type: application/javascript`,
  dans&nbsp;`wiki/tiddlers/tests/` (JS seulement) ou dans le plugin (TS possible, mais
  embarqué dans le plugin → alourdit). Lancement :&nbsp;`pnpm test`.
- **E2E Playwright** : specs dans&nbsp;`wiki/tiddlers/tests/playwright/` (+ un tiddler cible,
  ex. ouvert via&nbsp;`/#PlaywrightExampleWidget`). Le serveur de dev démarre tout seul si
  besoin (baseURL&nbsp;`http://127.0.0.1:8080`).

```bash
pnpm test:playwright          # headless (CI / vérif rapide)
pnpm test:playwright:headed   # navigateur visible (debug d'interactions)
pnpm test:playwright:debug    # Playwright Inspector, exécution en pause
```

## 15. Débogage

- Console du navigateur (F12) :&nbsp;`$tw` donne accès à tout. ⚠ le code widget tourne dans un
  **sandbox**, pas dans l'environnement global du navigateur.
- Instructions&nbsp;`debugger;`.
- `ReferenceError: Element is not defined` au démarrage = une lib **browser-only** exécutée
  trop tôt. Parade : passer le widget en&nbsp;`module-type: library` et écrire un **loader**
  `module-type: widget` qui ne le charge qu'en environnement navigateur.

## 16. Build & publication

```bash
pnpm build            # → dist/ : plugins séparés en JSON (autoporteurs)
pnpm run build:library# → dist/ : bibliothèque de plugins
pnpm run clean        # supprime dist/
pnpm run publish      # bibliothèque + wiki doc (core/médias externes → chargement rapide, en ligne uniquement)
pnpm run publish:offline # wiki mono-fichier téléchargeable
```

Le JSON de&nbsp;`pnpm build` est **autoporteur** (champs&nbsp;`title`,&nbsp;`plugin-type`,
`version`… inclus) : importable par glisser-déposer dans un wiki navigateur, ou copiable tel
quel dans le&nbsp;`tiddlers/` d'un wiki Node **sans&nbsp;`.meta`**.

⚠ On déploie un **artefact de build** : modifier le TS sans relancer&nbsp;`pnpm build` laisse
les wikis cibles sur une version périmée.

**Publication automatisée (GitHub).** Avec GitHub Pages, un simple&nbsp;`git push` déclenche
le build en ligne (Actions). Un **tag** de forme&nbsp;`vX.Y.Z` sur le commit publie en plus une
**Release**. Scripts modifiables dans&nbsp;`.github/workflows/`.

**Bibliothèque de plugins.** Recommandée pour distribuer : tiddler taggé
`$:/tags/PluginLibrary` avec l'URL de la bibliothèque dans le champ&nbsp;`url`. Les abonnés la
voient dans ControlPanel → Plugins → « Get more plugins » et reçoivent tes mises à jour. Tu
peux publier sur la **CPL** (bibliothèque publique de référence) via une Issue sur le dépôt
TiddlyWiki-CPL.

## 17. Mettre à jour l'outillage & développer plusieurs plugins

```bash
pnpm run update && pnpm install   # met à jour tiddlywiki-plugin-dev, tw5-typed… (périodiquement)
pnpm run new                      # ajoute un plugin supplémentaire → src/<nouveau-plugin>/
npx tiddlywiki-plugin-dev help    # aide de la CLI sous-jacente
```

Un même dépôt peut héberger plusieurs plugins (sous-plugins ou plugins liés) — pratique pour
éviter de multiplier les dépôts.

> Note (contexte nikorion) : dans ce workspace, un nouveau plugin se crée plutôt en **copiant
> ce dossier** (robocopy) — voir le guide `generer-plugin-typescript.md` et le CLAUDE.md du
> workspace. `pnpm run new` reste l'option pour ajouter un plugin **dans** un projet existant.
