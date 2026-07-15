<!--
  Example Svelte component paired with SCSS for this template.

  Not wired in by default: no `.meta`, and its import in index.ts is commented out — so
  the engine won't bundle it until it's enabled (see the commented block in index.ts).

  Demonstrates: Svelte 5 (runes $props/$state), `<script lang="ts">` and `<style lang="scss">`
  (variables, nesting, `sass:color` module). Required peers (already installed): svelte,
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
