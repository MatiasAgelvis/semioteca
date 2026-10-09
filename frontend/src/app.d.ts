// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

// Virtual modules provided by the cards-data-fallback Vite plugin
// (see frontend/vite.config.ts). They bundle the JSON datasets at build
// time with fallback paths (backend/ first, then static/content/).
declare module 'virtual:cards-data' {
  const data: unknown;
  export default data;
}
declare module 'virtual:relations-data' {
  const data: unknown;
  export default data;
}

export {};
