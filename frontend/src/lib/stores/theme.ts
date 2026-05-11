import { browser } from "$app/environment";

export const theme = {
    subscribe(run: (value: string) => void) {
        if (!browser) {
            run("light");
            return () => {};
        }

        const update = () => {
            const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
            run(currentTheme);
        };

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "data-theme") {
                    update();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        update();

        return () => observer.disconnect();
    }
};
