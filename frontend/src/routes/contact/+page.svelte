<script lang="ts">
  import { STATIC_FORMS_KEY } from '$env/static/public';

  let status: 'idle' | 'sending' | 'success' | 'error' = $state('idle');
  let errorMessage = $state('');

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    status = 'sending';
    const formEl = event.target as HTMLFormElement;
    const formData = new FormData(formEl);
    formData.append('accessKey', STATIC_FORMS_KEY);
    formData.append('subject', 'Contact Form Submission - Semioteca');
    try {
      const res = await fetch('https://api.staticforms.dev/submit', { method: 'POST', body: formData });
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

<div class="container mx-auto max-w-2xl p-4">
  <h1 class="text-3xl font-bold mb-6">Contacto</h1>

  {#if status === 'success'}
    <div role="alert" class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.</span>
    </div>
  {:else}
    {#if status === 'error'}
      <div role="alert" class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>¡Error! No se pudo enviar el mensaje.</span>
        <span class="text-xs opacity-80 ml-8">{errorMessage}</span>
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label
          for="name"
          class="block text-sm font-medium text-base-600 dark:text-base-400"
          >Nombre</label
        >
        <input
          type="text"
          name="name"
          id="name"
          required
          class="mt-1 block w-full input validator"
          minlength="1"
        />
        <span class="validator-hint hidden">Requerido</span>
      </div>

      <div>
        <label
          for="email"
          class="block text-sm font-medium text-base-600 dark:text-base-400"
          >Correo electrónico</label
        >
        <input
          type="email"
          name="email"
          id="email"
          required
          class="mt-1 block w-full input validator"
        />
        <div class="validator-hint">Ingrese un correo electrónico válido</div>
      </div>

      <div>
        <label
          for="message"
          class="block text-sm font-medium text-base-600 dark:text-base-400"
          >Mensaje</label
        >
        <textarea
          name="message"
          id="message"
          required
          rows="4"
          class="mt-1 block w-full textarea validator"
          minlength="1"
        ></textarea>
        <span class="validator-hint hidden">Requerido</span>
      </div>

      <button type="submit" class="btn btn-primary transition-colors">
        Enviar
      </button>
    </form>
  {/if}
</div>
