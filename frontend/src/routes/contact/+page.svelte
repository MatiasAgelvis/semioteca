<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<div class="container mx-auto max-w-2xl p-4">
  <h1 class="text-3xl font-bold mb-6">Contacto</h1>

  {#if form?.success}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
      <p>¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.</p>
    </div>
  {:else}
    {#if form?.error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
        <p>{form.error}</p>
      </div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-base-600 dark:text-base-400">Nombre</label>
        <input 
          type="text" 
          name="name" 
          id="name" 
          required 
          class="mt-1 block w-full input"
        />
      </div>
      
      <div>
        <label for="email" class="block text-sm font-medium text-base-600 dark:text-base-400">Correo electrónico</label>
        <input 
          type="email" 
          name="email" 
          id="email" 
          required 
          class="mt-1 block w-full input"
        />
      </div>

      <div>
        <label for="message" class="block text-sm font-medium text-base-600 dark:text-base-400">Mensaje</label>
        <textarea 
          name="message" 
          id="message" 
          required 
          rows="4"
          class="mt-1 block w-full textarea"
        ></textarea>
      </div>

      <button 
        type="submit" 
        class="btn btn-primary transition-colors"
      >
        Enviar
      </button>
    </form>
  {/if}
</div>
