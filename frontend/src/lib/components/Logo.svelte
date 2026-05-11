<script lang="ts">
    import { theme } from '$lib/stores/theme';

    type Props = {
        alt?: string;
        lightSrc?: string;
        darkSrc?: string;
        size?: number;
        className?: string;
    };

    let {
        alt = 'Significado Total logo',
        lightSrc = '/favicon/favicon_light.svg',
        darkSrc = '/favicon/favicon_dark.svg',
        size = 6,
        className = `h-${size} w-${size}`
    }: Props = $props();
</script>

<img
    src={$theme === 'dark' ? darkSrc : lightSrc}
    alt={alt}
    class={className}
/>
