# Idea: Info popovers & onboarding helpers

**Status:** To evaluate later

## Context

Discovered a useful DaisyUI pattern — a small info icon (circle `i` in a ring) that toggles a dropdown card with explanatory content:

```html
<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="btn btn-circle btn-ghost btn-xs text-info">
    <svg>…info icon…</svg>
  </div>
  <div tabindex="0" class="card card-sm dropdown-content bg-base-100 rounded-box z-1 w-64 shadow-sm">
    <div tabindex="0" class="card-body">
      <h2 class="card-title">Title</h2>
      <p>Description</p>
    </div>
  </div>
</div>
```

## Opportunity

This pattern could be reused across the app to provide lightweight inline help — e.g. explaining what a card relation type does, what a tag semantic means, etc. — without cluttering the UI or requiring a separate docs page.

## Broader idea

Create a small set of **helper/onboarding mechanisms** to lower the learning curve:

- Inline info popovers (the pattern above) for key UI elements
- A first-time tutorial or guided tour overlay
- A "quick tips" section or welcome modal for new users

## Next step

Evaluate whether the effort is worth the payoff — check if new users are getting confused at specific points, then target those first.
