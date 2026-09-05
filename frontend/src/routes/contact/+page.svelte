<script lang="ts">
  import { PUBLIC_STATIC_FORMS_KEY } from '$env/static/public';
  import { SITE_AUTHOR } from '$lib/config/site';

  let status: 'idle' | 'sending' | 'success' | 'error' = $state('idle');
  let errorMessage = $state('');

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    status = 'sending';
    const formEl = event.target as HTMLFormElement;
    const formData = new FormData(formEl);
    formData.append('accessKey', PUBLIC_STATIC_FORMS_KEY);
    formData.append('subject', 'Contact Form Submission - Semioteca');
    try {
      const res = await fetch('https://api.staticforms.dev/submit', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        status = 'success';
      } else {
        status = 'error';
        errorMessage = result.message || 'Something went wrong.';
      }
    } catch {
      status = 'error';
      errorMessage = 'Failed to send message. Please try again later.';
    }
  }
</script>

<svelte:head>
  <title>Contacto — Significado Total</title>
  <meta name="description" content="Contacto con Significado Total. Escríbeme." />
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-5 py-10 lg:px-10">
  <!-- Two-column grid: info sidebar + form -->
  <div class="mt-8 grid gap-8 lg:grid-cols-3">
    <!-- Sidebar: contacto rápido -->
    <div class="space-y-6 lg:col-span-1">
      <!-- Sobre el proyecto -->
      <div class="rounded-box border border-base-300/70 bg-base-100/80 p-6">
        <h2 class="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Sobre el proyecto
        </h2>
        <p class="mt-3 text-sm leading-6 text-base-content/70">
          Significado Total es un fichero digital de ciencias del significado que mantiene
          {SITE_AUTHOR}. Recoge tarjetas de estudio extraídas de obras sobre semántica, pragmática,
          lingüística, semiótica y filosofía del lenguaje, junto con artículos y ensayos que
          ejemplifican el uso de estos materiales con fines didácticos.
        </p>
      </div>
    </div>

    <!-- Columna principal: formulario -->
    <div class="lg:col-span-2">
      <div
        class="rounded-box border border-base-300/70 bg-base-100/90 p-8 shadow-xl shadow-base-content/5 lg:p-12"
      >
        {#if status === 'success'}
          <div role="alert" class="alert alert-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>¡Gracias por tu mensaje! Te responderé si puedo.</span>
          </div>
        {:else}
          <h2 class="text-xl font-black text-base-content">Envíame un mensaje</h2>
          <p class="mt-2 text-sm leading-6 text-base-content/60">
            Completa el formulario y te responderé si puedo.
          </p>

          {#if status === 'error'}
            <div role="alert" class="alert alert-error mt-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>¡Error! No se pudo enviar el mensaje.</span>
              {#if errorMessage}
                <span class="ml-4 text-xs opacity-80">{errorMessage}</span>
              {/if}
            </div>
          {/if}

          <form onsubmit={handleSubmit} class="mt-8 space-y-5">
            <div>
              <label for="name" class="block text-sm font-medium text-base-content/80">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                class="input mt-1.5 block w-full"
                minlength="1"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-base-content/80">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                class="input mt-1.5 block w-full"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label for="message" class="block text-sm font-medium text-base-content/80">
                Mensaje
              </label>
              <textarea
                name="message"
                id="message"
                required
                rows="5"
                class="textarea mt-1.5 block w-full"
                placeholder="Escribe tu mensaje aquí..."
                minlength="1"></textarea>
            </div>

            {#if status === 'sending'}
              <div class="flex justify-end">
                <button type="submit" class="btn btn-primary" disabled>
                  <span class="loading loading-spinner"></span>
                  Enviando…
                </button>
              </div>
            {:else}
              <div class="flex justify-end">
                <button type="submit" class="btn btn-primary transition-colors">
                  Enviar mensaje
                </button>
              </div>
            {/if}
          </form>
        {/if}
      </div>
    </div>
  </div>
</div>
