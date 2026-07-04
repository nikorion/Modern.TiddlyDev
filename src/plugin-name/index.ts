import { widget as Widget } from '$:/core/modules/widgets/widget.js';
import { IChangedTiddlers } from 'tiddlywiki';
import './index.css';

// --- Exemple : composant Svelte couplé à SCSS (décommenter pour l'activer) ---
// Prérequis déjà en devDependencies : `svelte`, `sass`, `svelte-preprocess`. Le pipeline
// esbuild-svelte + svelte-preprocess du moteur compile `Example.svelte` (voir ce fichier :
// `<script lang="ts">` + `<style lang="scss">`, transpilé par `sass`).
//
// import { mount, unmount } from 'svelte';
// import Example from './Example.svelte';
//
// Puis, dans render(), à la place du bouton ci-dessous :
//   const component = mount(Example, {
//     target: parent as Element,
//     anchor: nextSibling,
//     props: { label: 'Hello from Svelte' },
//   });
//   // Svelte 5 → mount()/unmount() (l'API classe `new Example({ target })` de Svelte ≤4 est
//   // legacy). Conserver `component` et appeler unmount(component) dans destroy()/removeChildDomNodes()
//   // pour éviter les fuites au retrait du widget.

class ExampleWidget extends Widget {
  private clickCount = 0;

  private getDisplayText() {
    return `This is a widget! Clicks: ${this.clickCount}`;
  }

  refresh(_changedTiddlers: IChangedTiddlers) {
    return false;
  }

  render(parent: Element, nextSibling: Element) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    const containerElement = $tw.utils.domMaker('button', {
      // Tailwind désactivé : les utilitaires démo (`p-2 rounded-md bg-cyan-600 text-white
      // hover:bg-cyan-700`) ont été retirés. Style via .tc-example-widget dans index.css.
      class: 'tc-example-widget',
      attributes: {
        type: 'button',
        'aria-label': 'Example widget click counter',
      },
      text: this.getDisplayText(),
    });
    containerElement.addEventListener('click', () => {
      this.clickCount += 1;
      containerElement.textContent = this.getDisplayText();
    });
    parent.insertBefore(containerElement, nextSibling);
    this.domNodes.push(containerElement);
  }
}

// zh tips
// 此处导出的模块变量名RandomNumber将作为微件（widget）的名称。使用<$RandomNumber/>调用此微件。
// Widget在tiddlywiki中的条目名、源文件以及源文件.meta文件名和Widget名字可以不一致。
// 比如Widget条目名可以为My-Widget,源文件以及源文件.meta文件名可以称为index.ts与index.ts.meta。最终的Widget名却是：RandomNumber，且使用<$RandomNumber/>调用此微件。
// 如果为一个脚本文件添加了 .meta 将会被视为入口文件。
// en tips
// The module variable name RandomNumber exported here will be used as the name of the widget. Use <$RandomNumber/> to call this Widget.
// The Widget's tiddler name, source file, and source file .meta file name in tiddlywiki can be inconsistent with the Widget name.
// For example, the Widget entry name could be My-Widget, and the source and source.meta file names could be index.ts and index.ts.meta, but the final Widget name could be RandomNumber, and the widget would be called with <$RandomNumber/>.
// If a .meta is added to a script file it will be treated as an entry file.
declare let exports: {
  RandomNumber: typeof ExampleWidget;
};
exports.RandomNumber = ExampleWidget;
