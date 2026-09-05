import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { LIGHT_THEME } from '$lib/config/theme';

const createTheme = () => {
  const { subscribe, set } = writable<string>(
    browser ? document.documentElement.getAttribute('data-theme') || LIGHT_THEME : LIGHT_THEME,
  );

  if (browser) {
    const observer = new MutationObserver(() => {
      set(document.documentElement.getAttribute('data-theme') || LIGHT_THEME);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  return { subscribe };
};

export const theme = createTheme();
