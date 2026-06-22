# Composer — UX Polish

Date: 2026-06-22
Status: Resolved

---

## 1. Card border shift ~~when selected~~

**Solution:** No border changes at all. All cards look identical — the `[✓ Añadido]` button and the header badge are the sole indicators. Zero layout shift.

---

## 2. Detail page — buttons overflow ~~at top~~

**Solution:** Moved the add button to a controls bar at the bottom of the card, matching the card list view exactly. Header row has only "Volver" + "Relacionadas" + "Explorar".

---

## 3. Composer status ~~on detail page~~

**Solution:** Document icon with count badge in the global site header. Visible on every page. Click goes to `/cards/compose`. Detail page also has the same controls bar as the card list.

---

## 4. Card list — button group layout

**Solution:** Card redesigned with full-width toggle bar. Controls bar has tags + relations on the left, `[Añadir]` + `[Opciones]` on the right. Clean two-button group, no crowding.

---

## Beyond the doc — additional polish

- **Composer page:** wrapped in card, metadata moved to accordion, card rows show inline preview on click
- **Tray:** shadow removed, sits flush against footer
- **Single source of truth:** same controls bar pattern used on card list, card detail, and composer
