<!--
  Exemple de composant Svelte couplé à SCSS pour ce template.

  Non câblé par défaut : aucun `.meta`, et son import dans index.ts est commenté — le moteur
  ne le bundle donc pas tant qu'on ne l'active pas (voir le bloc commenté dans index.ts).

  Démontre : Svelte 5 (runes $props/$state), `<script lang="ts">` et `<style lang="scss">`
  (variables, nesting, module `sass:color`). Peers requis (déjà installés) : svelte,
  svelte-preprocess, sass, typescript.
-->
<script lang="ts">
  let { label = 'Svelte + SCSS' }: { label?: string } = $props();
  let count = $state(0);
</script>

<button class="example-widget" onclick={() => (count += 1)}>
  {label} — clicks: {count}
</button>

<style lang="scss">
  @use 'sass:color';

  $accent: #06b6d4;

  .example-widget {
    padding: 0.5rem;
    border-radius: 0.375rem;
    color: #fff;
    background: $accent;

    &:hover {
      background: color.adjust($accent, $lightness: -8%);
    }
  }
</style>
