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
        className = ''
    }: Props = $props();

    const dimension = $derived(() => `${size * 0.25}rem`);
</script>

<img
    src={$theme === 'dark' ? darkSrc : lightSrc}
    alt={alt}
    class={className}
    style={`width: ${dimension}; height: ${dimension};`}
/>
