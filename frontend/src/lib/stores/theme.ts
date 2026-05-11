import { browser } from "$app/environment";
import { writable } from "svelte/store";

const createTheme = () => {
    const { subscribe, set } = writable<string>(
        browser ? (document.documentElement.getAttribute("data-theme") || "light") : "light"
    );

    if (browser) {
        const observer = new MutationObserver(() => {
            set(document.documentElement.getAttribute("data-theme") || "light");
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    return { subscribe };
};

export const theme = createTheme();
