(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = localStorage.getItem('theme');

    const applyMode = () => {
        if (stored) {
            root.dataset.theme = stored;
        } else {
            root.dataset.theme = media.matches ? 'dark' : 'light';
        }
    };

    applyMode();
    media.addEventListener('change', () => {
        if (!localStorage.getItem('theme')) {
            root.dataset.theme = media.matches ? 'dark' : 'light';
        }
    });
})();
