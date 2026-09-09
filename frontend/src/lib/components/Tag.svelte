<script lang="ts">
  const VARIANT_CLASSES = {
    outline: 'badge-outline',
    secondary: 'badge-secondary',
    static: 'badge-soft badge-base-content opacity-60',
    filter: 'badge-primary',
  } as const;

  const HOVER_CLASSES = {
    primary: 'hover:badge-primary',
    error: 'hover:badge-error',
  } as const;

  const SIZE_CLASSES = {
    xs: 'badge-xs text-[8px]',
    sm: 'badge-sm text-[10px]',
  } as const;

  let {
    tag,
    size = 'sm',
    variant = 'outline',
    uppercase = false,
    removable = false,
    hoverColor = 'primary',
    class: className = '',
    onclick,
  }: {
    tag: string;
    size?: 'xs' | 'sm';
    variant?: keyof typeof VARIANT_CLASSES;
    uppercase?: boolean;
    removable?: boolean;
    hoverColor?: keyof typeof HOVER_CLASSES;
    class?: string;
    onclick?: () => void;
  } = $props();

  const variantClasses = $derived(VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.outline);
  const hoverClasses = $derived(
    onclick ? (HOVER_CLASSES[hoverColor] ?? HOVER_CLASSES.primary) : '',
  );
</script>

{#if onclick}
  <button
    type="button"
    class="badge font-semibold gap-1 transition-colors {SIZE_CLASSES[
      size
    ]} {variantClasses} {uppercase
      ? 'uppercase'
      : ''} cursor-pointer {hoverClasses} hover:opacity-100 {className}"
    {onclick}
  >
    {tag}
    {#if removable}
      <span>×</span>
    {/if}
  </button>
{:else}
  <span
    class="badge font-semibold gap-1 transition-colors {SIZE_CLASSES[
      size
    ]} {variantClasses} {uppercase ? 'uppercase' : ''} {className}"
  >
    {tag}
  </span>
{/if}
