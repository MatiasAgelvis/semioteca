# Design System

Conventions for visual language that live **above** the daisyUI theme. The theme
handles colors, fonts, and component internals; this document covers layout,
spacing, border radius, borders, and the highlight/subdue hierarchy — the things
the theme does not decide for us.

Status: **working spec.** Values below are the target; the app has not fully
migrated yet. See [Migration notes](#migration-notes).

---

## Layout

| Token         | Value             | Where                                      |
| ------------- | ----------------- | ------------------------------------------ |
| Page width    | `max-w-7xl`       | every page section, header, footer         |
| Page gutter   | `px-5 lg:px-10`   | horizontal padding inside `max-w-7xl`      |
| Section gap   | `gap-8` / `py-10` | vertical rhythm between page sections      |
| Heading block | `mb-6`            | space under a section title before content |
| Card padding  | `p-5`             | body of a card surface                     |

Rules:

- All page content lives inside `max-w-7xl` with the standard gutter. Do not
  introduce a second page-width token.
- A page section uses the same gutter on every breakpoint; only the gutter size
  steps up at `lg`.

## Border radius

A four-step scale. Radius increases with the _elevation_ of the surface — the
higher a surface floats above the page, the rounder it is.

| Token            | Tailwind       | Use                                       |
| ---------------- | -------------- | ----------------------------------------- |
| `radius-pill`    | `rounded-full` | chips, badges, buttons, the search bar    |
| `radius-element` | `rounded-lg`   | images, code blocks, inner boxes          |
| `radius-item`    | `rounded-xl`   | items nested inside a surface             |
| `radius-surface` | `rounded-2xl`  | cards, sidebars, floating panels, dialogs |

Rules:

- A top-level surface (card, sidebar, search result, popover) uses `rounded-2xl`.
- A selectable item _inside_ a surface uses `rounded-xl`.
- Inline elements (images, highlighted boxes) use `rounded-lg`.
- Never mix `rounded-box` with `rounded-2xl` for the same role. Migrate
  `rounded-box` surfaces to `rounded-2xl`.

## Borders

| Token             | Value                     | Use                                  |
| ----------------- | ------------------------- | ------------------------------------ |
| `border-surface`  | `border-base-300`         | static surfaces that sit on the page |
| `border-floating` | `border-base-200`         | overlays, popovers, inner separators |
| `border-hover`    | `hover:border-primary/30` | interactive surface hover emphasis   |

Rules:

- A persistent surface (card, sidebar) gets `border-base-300`; it must hold its
  own against the page background.
- A floating surface (popover, dropdown, sheet) gets `border-base-200`; it is
  softer because it is transient and layered.
- Interactive surfaces gain `hover:border-primary/30` (or `/50` for
  high-emphasis controls) to signal clickability.

## Spacing

Dense vs comfortable is the only axis that matters.

| Token           | Value       | Use                                           |
| --------------- | ----------- | --------------------------------------------- |
| `space-dense`   | `px-3 py-2` | TOC rows, sidebar lists (high info density)   |
| `space-comfort` | `px-4 py-3` | search results, menu items (readable, sparse) |

Rules:

- Persistent sidebars (TOC, book list) stay dense (`px-3 py-2`).
- Transient overlays (menu, search results) stay comfortable (`px-4 py-3`).
- Do not use dense spacing in an overlay or comfortable spacing in a sidebar —
  each context keeps its own rhythm.

## Highlight & subdue

Three text treatments, plus a surface treatment.

| Treatment      | Value                        | Use                                      |
| -------------- | ---------------------------- | ---------------------------------------- |
| Primary text   | full opacity                 | titles, body, the main reading text      |
| Secondary text | `opacity-70`                 | descriptions, subtitles, secondary lines |
| Meta text      | `opacity-50`                 | labels, page numbers, timestamps         |
| Active item    | `bg-primary/10 text-primary` | the selected item in a list/menu         |

Rules:

- `opacity-70` = "readable but secondary". `opacity-50` = "scan-only metadata".
  Do not use `opacity-60` or `opacity-80` for these roles.
- Long-form prose may use `opacity-80` only to soften dense body text; this is
  a readability choice, not a hierarchy level.
- The active item in an overlay list uses `bg-primary/10` + `text-primary`.
  Persistent sidebars may keep daisyUI's `menu-active`; do not invent a third
  treatment.
- Top-level nav (desktop) uses `text-primary` + a thin underline. This is the
  one exception to the active-item rule, because it is horizontal, not a list.

## Surfaces

| Surface | Value                             | Use                                        |
| ------- | --------------------------------- | ------------------------------------------ |
| Base    | `bg-base-100`                     | cards, sidebars, floating panels           |
| Frosted | `bg-base-100/90 backdrop-blur-md` | header and overlays over scrolling content |
| Inset   | `bg-base-200/40` (or `/50`)       | highlighted boxes inside a surface         |

Rules:

- A surface is opaque (`bg-base-100`) unless it scrolls over content; only then
  is it frosted.
- Inset boxes (callouts, excerpts) use `bg-base-200/40`, never a base-300 fill.

---

## Migration notes

Known inconsistencies to reconcile, in priority order:

1. **Radius** — `SidebarContainer` uses `rounded-box` (1rem); cards, search
   results, blog cards, and the mobile menu use `rounded-2xl` (1.5rem).
   → unify all top-level surfaces on `rounded-2xl`.
2. **Borders** — `border-base-300` and `border-base-200` are currently
   interchangeable in several components.
   → assign by the rule above: `300` for static, `200` for floating.
3. **Active state** — three treatments exist: `menu-active` (sidebar),
   `bg-primary/10 text-primary` (mobile menu), underline (desktop nav).
   → keep all three but scope them: `menu-active` = persistent sidebars,
   `bg-primary/10` = overlay lists, underline = horizontal nav.
4. **Subdue opacity** — `opacity-50/60/70/80` are used loosely.
   → map roles to the three levels above and remove `60`/`80` except in prose.
