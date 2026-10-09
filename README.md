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

## Tooling

Tool versions and orchestration scripts live in `mise.toml`. Install [mise](https://mise.jdx.dev/) and run `mise install` once — that pins Node LTS and Python 3.14 for the repo.

Tasks are invoked as `mise run <task-name>` (e.g. `mise run content-sync`, `mise run frontend-dev`).

---

## Common commands

All commands run from the **repo root**.

### Development

```sh
# Sync content then start the dev server
mise run content-sync && mise run frontend-dev
```

### Sync content

When you edit files in `backend/` (blog posts, images, CV), propagate the changes to the frontend with:

```sh
mise run content-sync
```

This wipes and re-copies `frontend/static/content/` from the backend sources.

### Regenerate cards from .odt manuscripts

If you modified the source manuscripts or the Python generation logic:

```sh
mise run content-extract      # regenerate cards.json and card images only
mise run content-build        # generate + tag + relations + sync in one step
mise run content-commit-update  # commit staged files with a preset message
```

### Full build (for deploy)

```sh
mise run build   # frontend build only
```

Static output is written to `frontend/build/`.

Deploys do not regenerate content. Update `frontend/static/content/` locally with `mise run content-sync` or `mise run content-build`, then commit the synced files.

---

## Adding or editing content

### Blog

1. Create a folder at `backend/BLOG/<slug>/`.
2. Add a `.md` file with the post content. The title is taken from the first `# Heading`.
3. Put images in the same folder and reference them with relative paths (`![alt](image.jpg)`).
4. Run `mise run content-sync`.

### CV / Documents

1. Place PDFs in `backend/CV/`.
2. Run `mise run content-sync`.

### Bibliographic cards

1. Edit the `.odt` manuscripts in `backend/ODT/`.
2. Run `mise run content-build` (regenerates `cards.json`, tags, computes relations, and syncs).

---

## Deploy (Vercel)

The project is configured for Vercel (`vercel.json`). Install and build commands run inside `frontend/`:

```json
{
  "installCommand": "cd frontend && npm ci",
  "buildCommand": "cd frontend && npm run build"
}
```

The build produces SvelteKit's Vercel artifacts under `frontend/.vercel/output`.
