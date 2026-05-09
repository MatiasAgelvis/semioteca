# Semioteca

A static semiotics archive with bibliographic cards, blog, CV, and documents. The backend generates data with Python; the frontend is a static site built with SvelteKit + DaisyUI.

---

## Project structure

```
backend/                   Content sources: .odt manuscripts, .md blog posts, images, CV
scripts/                   Sync and build utilities
frontend/                  SvelteKit app (source)
frontend/static/content/   Synced content artifact tracked for deploys
```

---

## Common commands

All commands run from the **repo root**.

### Development

```sh
# Sync content then start the dev server
npm run content:sync && npm run frontend:dev
```

### Sync content

When you edit files in `backend/` (blog posts, images, CV), propagate the changes to the frontend with:

```sh
npm run content:sync
```

This wipes and re-copies `frontend/static/content/` from the backend sources.

### Regenerate cards from .odt manuscripts

If you modified the source manuscripts or the Python generation logic:

```sh
npm run content:generate   # regenerate cards.json and card images only
npm run content:prepare    # generate + sync in one step
```

### Full build (for deploy)

```sh
npm run build   # frontend:build only
```

Static output is written to `frontend/build/`.

Deploys do not regenerate content. Update `frontend/static/content/` locally with `npm run content:sync` or `npm run content:prepare`, then commit the synced files.

---

## Adding or editing content

### Blog

1. Create a folder at `backend/BLOG/<slug>/`.
2. Add a `.md` file with the post content. The title is taken from the first `# Heading`.
3. Put images in the same folder and reference them with relative paths (`![alt](image.jpg)`).
4. Run `npm run content:sync`.

### CV / Documents

1. Place PDFs in `backend/CV/`.
2. Run `npm run content:sync`.

### Bibliographic cards

1. Edit the `.odt` manuscripts in `backend/ODT/`.
2. Run `npm run content:prepare` (regenerates `cards.json` and syncs).

---

## Deploy (Vercel)

The project is configured for Vercel (`vercel.json`). Build command: `npm run build`.
The build is run from the repo root and produces SvelteKit's Vercel artifacts under `frontend/.vercel/output`.
